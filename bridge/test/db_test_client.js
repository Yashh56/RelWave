const { spawn } = require("child_process");

console.log("Starting bridge...");
const child = spawn("node", ["dist/index.js"], {
  cwd: __dirname + "/..",
  stdio: ["pipe", "pipe", "pipe"],
});

child.stdout.on("data", (d) => {
  const s = d.toString().trim();
  console.log("<< bridge ->", s);

  try {
    const msg = JSON.parse(s);

    // handle response
    if (msg.id && pending[msg.id]) {
      pending[msg.id].resolve(msg.result || msg);
      delete pending[msg.id];
      return;
    }

    // handle notifications
    if (msg.method) {
      console.log("NOTIFY:", msg.method, msg.params);
    }
  } catch (err) {
    /* ignore junk lines */
  }
});

child.stderr.on("data", (d) => {
  console.log("bridge stderr:", d.toString());
});

let nextId = 1;
const pending = {};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const msg = JSON.stringify({ id, method, params });

    pending[id] = { resolve, reject };
    child.stdin.write(msg + "\n");
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (pending[id]) {
        delete pending[id];
        reject(new Error(`Request ${id} timed out`));
      }
    }, 5000);
  });
}

(async () => {
  await new Promise((r) => setTimeout(r, 500));

  console.log("\n=== TEST: db.add ===");
  const addRes = await send("db.add", {
    // Fields sent directly, not nested under 'entry'
    name: "Local Postgres",
    type: "postgres",
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: "testdb",
    password: "postgres",
  });
  console.log("db.add ->", addRes);
  
  // Extract the ID from the response
  const dbId = addRes?.data?.id;
  console.log("Created DB with ID:", dbId);

  console.log("\n=== TEST: db.list ===");
  const listRes = await send("db.list", {});
  console.log("db.list ->", listRes);

  if (dbId) {
    console.log("\n=== TEST: db.get ===");
    const getRes = await send("db.get", { id: dbId });
    console.log("db.get ->", getRes);

    console.log("\n=== TEST: db.update ===");
    const updateRes = await send("db.update", {
      id: dbId,
      name: "Local PG (updated)",
    });
    console.log("db.update ->", updateRes);

    console.log("\n=== TEST: db.listTables ===");
    const listTables = await send("db.listTables", { id: dbId });
    console.log("db.listTables ->", listTables);

    console.log("\n=== TEST: db.connectTest ===");
    const t = await send("db.connectTest", { id: dbId });
    console.log("db.connectTest ->", t);

    console.log("\n=== TEST: db.delete ===");
    const delRes = await send("db.delete", { id: dbId });
    console.log("db.delete ->", delRes);
  } else {
    console.log("Skipping remaining tests - no DB ID available");
  }

  console.log("\n=== TEST DONE ===");

  child.kill("SIGINT");
})();