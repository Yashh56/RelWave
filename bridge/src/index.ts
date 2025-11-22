import { JsonStdio } from "./jsonRpc";
import { randomUUID } from "node:crypto";
import logger from "./services/logger";
import { testConnection, streamQueryCancelable } from "./connectors/postgres";
import { SessionManager } from "./sessionManager";
import { registerDbHandlers } from "./jsonRpcHandler";

const rpc = new JsonStdio();
const sessions = new SessionManager();

// --- Adapter: expose global rpcRegister so handlers can register themselves ---
// This adapter does two things:
// 1) If the dispatcher exposes a registration API (on/register/registerMethod/addHandler) we attempt to use it.
// 2) Always ensure globalThis.rpcRegister writes into globalThis._rpcHandlers (the fallback map).
function attachRpcRegister(rpcDispatcher: any) {
  // fallback map
  (globalThis as any)._rpcHandlers = (globalThis as any)._rpcHandlers || {};

  const registerFn = (
    method: string,
    handler: (params: any, id: number | string) => Promise<void> | void
  ) => {
    if (!method || typeof handler !== "function") return;

    // Always store in fallback global map (guaranteed)
    (globalThis as any)._rpcHandlers[method] = handler;

    // Also attempt to register with dispatcher if it offers an API
    try {
      if (typeof rpcDispatcher.on === "function") {
        rpcDispatcher.on(method, handler);
        return;
      }
    } catch (e) {
      // ignore and continue to try others
    }
    try {
      if (typeof rpcDispatcher.register === "function") {
        rpcDispatcher.register(method, handler);
        return;
      }
    } catch (e) {}
    try {
      if (typeof rpcDispatcher.registerMethod === "function") {
        rpcDispatcher.registerMethod(method, handler);
        return;
      }
    } catch (e) {}
    try {
      if (typeof rpcDispatcher.addHandler === "function") {
        rpcDispatcher.addHandler(method, handler);
        return;
      }
    } catch (e) {}
  };

  (globalThis as any).rpcRegister = registerFn;
}

// attach to rpc dispatcher
attachRpcRegister(rpc);

try {
  if (typeof registerDbHandlers === "function") {
    registerDbHandlers(rpc, logger);
    logger.info("Registered external JSON-RPC handlers (db.*)");
  } else {
    logger.debug("No external jsonRpcHandlers.registerDbHandlers found");
  }
} catch (e) {
  logger.debug({ e }, "jsonRpcHandlers not found or failed to register (this is okay in some builds)");
}

logger.info("Bridge (JSON-RPC) starting");

// send initial ready notification
rpc.sendNotification("bridge.ready", { pid: process.pid });

// handle incoming notifications (one-way)
rpc.on("notification", (n: any) => {
  logger.debug({ notification: n }, "received notification (one-way)");
});

// helper to send a query error notification
function notifyQueryError(sessionId: string, err: any) {
  try {
    rpc.sendNotification("query.error", {
      sessionId,
      error: { message: String(err) },
    });
  } catch (e) {
    /* ignore */
  }
}

// utility: safe sleep
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

rpc.on("request", async (req: any) => {
  const id = req.id;
  const method = req.method;
  const params = req.params;
  logger.info({ id, method }, "incoming request");

  try {
    // --- First: consult any global handlers registered by jsonRpcHandlers or other modules ---
    const handlersMap =
      (globalThis as any)._rpcHandlers ||
      (globalThis as any).rpcHandlers ||
      (globalThis as any).rpcHandlers; // defensive

    if (handlersMap && handlersMap[method]) {
      try {
        // call external handler and let it respond using rpc.sendResponse / rpc.sendError
        await handlersMap[method](params, id);
        return;
      } catch (eh: any) {
        logger.error({ eh, method, id }, "external rpc handler threw");
        return rpc.sendError(id, { code: "HANDLER_ERROR", message: String(eh) });
      }
    }

    // --- Fallback: built-in switch/case handlers ---
    switch (method) {
      case "ping": {
        rpc.sendResponse(id, { ok: true, data: { msg: "pong", echo: params } });
        break;
      }

      case "health.ping": {
        rpc.sendResponse(id, {
          ok: true,
          data: { uptimeSec: process.uptime(), pid: process.pid },
        });
        break;
      }

      case "connection.test": {
        const cfg = params?.config;
        const res = await testConnection(cfg);
        rpc.sendResponse(id, { ok: res.ok, message: res.message });
        break;
      }

      case "query.createSession": {
        const sessionId = randomUUID();
        sessions.create(sessionId, {});
        rpc.sendResponse(id, { ok: true, data: { sessionId } });
        break;
      }

      case "query.run": {
        /**
         * params: { sessionId, connection: PGConfig, sql, batchSize? }
         * Emits:
         *  - query.started { sessionId, info }
         *  - query.result { sessionId, batchIndex, rows, columns, complete:false }
         *  - query.progress { sessionId, rowsSoFar, elapsedMs }
         *  - query.done { sessionId, rows, timeMs, status }
         */
        const { sessionId, connection, sql, batchSize = 200 } = params || {};
        if (!sessionId)
          return rpc.sendError(id, {
            code: "NO_SESSION",
            message: "Missing sessionId",
          });

        let cancelled = false;
        const cancelState: { fn: (() => Promise<void>) | null } = { fn: null };

        // notify that query is starting
        rpc.sendNotification("query.started", {
          sessionId,
          info: { sqlPreview: (sql || "").slice(0, 200) },
        });

        // progress state
        const start = Date.now();
        let batchIndex = 0;
        let totalRows = 0;
        let lastProgressEmit = Date.now();

        // Create cancellable runner with onBatch/onDone implemented
        const runner = streamQueryCancelable(
          connection,
          sql,
          batchSize,
          async (rows, columns) => {
            if (cancelled) throw new Error("query cancelled");
            totalRows += rows.length;

            // send batch
            rpc.sendNotification("query.result", {
              sessionId,
              batchIndex: batchIndex++,
              rows,
              columns,
              complete: false,
            });

            // emit progress at most every 500ms
            const now = Date.now();
            if (now - lastProgressEmit >= 500) {
              lastProgressEmit = now;
              rpc.sendNotification("query.progress", {
                sessionId,
                rowsSoFar: totalRows,
                elapsedMs: now - start,
              });
            }
          },
          () => {
            rpc.sendNotification("query.done", {
              sessionId,
              rows: totalRows,
              timeMs: Date.now() - start,
              status: "success",
            });
          }
        );

        // set cancel function synchronously to avoid race
        cancelState.fn = async () => {
          try {
            await runner.cancel();
          } catch (e) {
            /* ignore */
          }
        };

        // register cancel handler with session manager
        sessions.registerCancel(sessionId, async () => {
          cancelled = true;
          if (cancelState.fn) await cancelState.fn();
        });

        // run the promise in background
        (async () => {
          try {
            await runner.promise;
          } catch (err: any) {
            if (String(err).toLowerCase().includes("cancel") || cancelled) {
              rpc.sendNotification("query.done", {
                sessionId,
                rows: totalRows,
                timeMs: Date.now() - start,
                status: "cancelled",
              });
            } else {
              logger.error({ err, sessionId }, "streamQuery error");
              notifyQueryError(sessionId, err);
            }
          } finally {
            // final progress emit before cleanup
            try {
              rpc.sendNotification("query.progress", {
                sessionId,
                rowsSoFar: totalRows,
                elapsedMs: Date.now() - start,
              });
            } catch (e) {}
            sessions.remove(sessionId);
            cancelState.fn = null;
          }
        })();

        rpc.sendResponse(id, { ok: true });
        break;
      }

      case "query.cancel": {
        const { sessionId } = params || {};
        if (!sessionId)
          return rpc.sendError(id, {
            code: "NO_SESSION",
            message: "Missing sessionId",
          });
        const ok = await sessions.cancel(sessionId);
        rpc.sendResponse(id, { ok: true, data: { cancelled: ok } });
        break;
      }

      default: {
        rpc.sendError(id, {
          code: "UNKNOWN_METHOD",
          message: `Unknown method ${method}`,
        });
      }
    }
  } catch (err: any) {
    logger.error({ err }, "error handling request");
    rpc.sendError(id, { code: "INTERNAL_ERROR", message: String(err) });
  }
});

// graceful shutdown logging
process.on("SIGINT", () => {
  logger.info("Bridge received SIGINT — exiting");
  process.exit(0);
});
process.on("SIGTERM", () => {
  logger.info("Bridge received SIGTERM — exiting");
  process.exit(0);
});
