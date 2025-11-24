import { useState, useEffect } from "react";
import { Database, Plus, Search, Server, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatabaseCard } from "@/components/DatabaseCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { bridgeApi, type DatabaseConnection } from "@/services/bridgeApi";
import { startBridgeListeners, stopBridgeListeners, isBridgeReady } from "@/services/bridgeClient";
import { Checkbox } from "@/components/ui/checkbox";
import { ModeToggle } from "@/components/mode-toggle";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    host: "",
    port: "",
    user: "",
    password: "",
    database: "",
    sslmode: "",
    ssl: false
  });

  // Initialize bridge listeners on mount
  useEffect(() => {
    const initBridge = async () => {
      try {
        await startBridgeListeners();

        // Listen for bridge.ready notification
        const handleBridgeReady = () => {
          console.log('Bridge ready event received');
          setBridgeReady(true);
          loadDatabases();
        };

        window.addEventListener('bridge:bridge.ready', handleBridgeReady);

        // Check if bridge is already ready
        if (isBridgeReady()) {
          setBridgeReady(true);
          loadDatabases();
        }

        return () => {
          window.removeEventListener('bridge:bridge.ready', handleBridgeReady);
          stopBridgeListeners();
        };
      } catch (error: any) {
        console.error('Failed to initialize bridge:', error);
        toast.error("Failed to connect to database bridge", {
          description: error.message
        });
        setLoading(false);
      }
    };

    initBridge();
  }, []);

  const loadDatabases = async () => {
    if (!isBridgeReady()) {
      console.warn('Bridge not ready, skipping database load');
      return;
    }

    try {
      setLoading(true);
      const dbs = await bridgeApi.listDatabases();
      setDatabases(dbs);
      console.log('Loaded databases:', dbs);
    } catch (error: any) {
      console.error('Failed to load databases:', error);
      toast.error("Failed to load databases", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDatabases();
    setRefreshing(false);
    toast.success("Databases refreshed");
  };

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDatabase = async () => {
    // Validate required fields
    const required = ["name", "type", "host", "port", "user", "database"];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);

    if (missing.length > 0) {
      toast.error("Missing required fields", {
        description: `Please fill in: ${missing.join(", ")}`
      });
      return;
    }

    try {
      const newDb = await bridgeApi.addDatabase({
        name: formData.name,
        type: formData.type,
        host: formData.host,
        port: parseInt(formData.port),
        user: formData.user,
        ssl: formData.ssl, // Use the form state for SSL
        sslmode: formData.ssl ? (formData.sslmode || 'require') : 'disable', // Use form state for sslmode if needed, default to require
        password: formData.password,
        database: formData.database
      });

      toast.success("Database connection added successfully", {
        description: `${newDb.name} is now available.`
      });

      // Reset form
      setFormData({
        name: "",
        type: "",
        host: "",
        port: "",
        user: "",
        password: "",
        database: "",
        sslmode: "",
        ssl: false
      });

      setIsDialogOpen(false);
      await loadDatabases();
    } catch (error: any) {
      toast.error("Failed to add database", {
        description: error.message
      });
    }
  };

  const handleDeleteDatabase = async (id: string, name: string) => {
    try {
      await bridgeApi.deleteDatabase(id);
      toast.success("Database connection removed", {
        description: `${name} has been deleted.`
      });
      await loadDatabases();
    } catch (error: any) {
      toast.error("Failed to delete database", {
        description: error.message
      });
    }
  };

  const handleTestConnection = async (id: string, name: string) => {
    try {
      const result = await bridgeApi.testConnection(id);
      if (result.ok) {
        toast.success("Connection successful", {
          description: `Successfully connected to ${name}`
        });
        console.log(result)
      } else {
        toast.error("Connection failed", {
          description: result.message || "Could not connect to database"
        });
      }
    } catch (error: any) {
      toast.error("Connection test failed", {
        description: error.message
      });
    }
  };

  const connectedCount = databases.length; // All saved databases are considered "connected"
  const totalTables = databases.length * 25; // Mock calculation - you can fetch real data
  const totalSize = "0 GB"; // Mock value - you can calculate real size

  // Show bridge initialization status
  if (!bridgeReady && loading) {
    return (
      // Added dark mode classes for bg and text
      <div className="h-screen bg-gray-50 dark:bg-[#050505] text-black dark:text-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Initializing Database Bridge</h2>
          <p className="text-gray-500 dark:text-gray-400">Please wait while we connect to the bridge...</p>
        </div>
      </div>
    );
  }

  // Show error if bridge failed to initialize
  if (!bridgeReady && !loading) {
    return (
      // Added dark mode classes for bg and text
      <div className="h-screen bg-gray-50 dark:bg-[#050505] text-black dark:text-white flex items-center justify-center overflow-hidden">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Bridge Connection Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Could not connect to the database bridge. Please restart the application.
          </p>
          <Button onClick={() => window.location.reload()} className="bg-cyan-500 hover:bg-cyan-600">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    // Base container: Light: bg-gray-50, Dark: bg-[#050505]
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#050505] text-black dark:text-white overflow-hidden">
      {/* Header: Light: bg-white/80 border-gray-200, Dark: bg-black/30 border-primary/10 */}
      <header className="border-b border-gray-200 dark:border-primary/10 bg-white/80 dark:bg-black/30 backdrop-blur-xl sticky top-0 z-50 shadow-md dark:shadow-lg flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-xl shadow-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-600">
                  Data Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage and visualize your connections</p>
              </div>
            </div>
            {/* Control buttons area */}
            <div className="flex items-center gap-2">

              {/* Mode Toggle placed first */}
              <ModeToggle />

              {/* Refresh Button: Light: border-gray-300, Dark: border-gray-700, Text: gray-700/white */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-300 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 transition-all shadow-xl shadow-fuchsia-500/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </DialogTrigger>
                {/* Dialog Content: Light: bg-white, Dark: bg-gray-900/90 */}
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900/90 backdrop-blur-sm text-black dark:text-white border-gray-300 dark:border-primary/20 rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-black dark:text-white">
                      Add New Database Connection 🔌
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                      Connect to a local, Docker, or remote database instance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-name" className="text-gray-700 dark:text-gray-300">Connection Name</Label>
                      {/* Input: Light: bg-gray-100 border-gray-300, Dark: bg-gray-800/70 border-gray-700 */}
                      <Input
                        id="db-name"
                        placeholder="My Production DB"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-type" className="text-gray-700 dark:text-gray-300">Database Type</Label>
                      <Select value={formData.type} onValueChange={(val) => handleInputChange('type', val)}>
                        {/* Select Trigger: Light: bg-gray-100 border-gray-300, Dark: bg-gray-800/70 border-gray-700 */}
                        <SelectTrigger id="db-type" className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors">
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                        {/* Select Content: Light: bg-white, Dark: bg-gray-900 */}
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-300 dark:border-primary/20 text-black dark:text-white shadow-xl">
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="mongodb">MongoDB</SelectItem>
                          <SelectItem value="sqlite">SQLite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="host" className="text-gray-700 dark:text-gray-300">Host</Label>
                        <Input
                          id="host"
                          placeholder="localhost"
                          value={formData.host}
                          onChange={(e) => handleInputChange('host', e.target.value)}
                          className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port" className="text-gray-700 dark:text-gray-300">Port</Label>
                        <Input
                          id="port"
                          placeholder="5432"
                          value={formData.port}
                          onChange={(e) => handleInputChange('port', e.target.value)}
                          className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                        <Input
                          id="username"
                          placeholder="postgres"
                          value={formData.user}
                          onChange={(e) => handleInputChange('user', e.target.value)}
                          className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="database" className="text-gray-700 dark:text-gray-300">Database Name</Label>
                      <Input
                        id="database"
                        placeholder="myapp_db"
                        value={formData.database}
                        onChange={(e) => handleInputChange('database', e.target.value)}
                        className="bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-700 focus:border-cyan-500 text-black dark:text-white transition-colors"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ssl"
                        checked={formData.ssl}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ssl: checked as boolean }))}
                      />
                      <Label htmlFor="ssl" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                        Enable SSL Connection
                      </Label>
                    </div>
                  </div>
                  {/* Footer border: Light: border-gray-300/50, Dark: border-gray-700/50 */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-300/50 dark:border-gray-700/50">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      // Cancel Button: Light: border-gray-400 text-gray-700, Dark: border-gray-600 text-gray-300
                      className="border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDatabase}
                      className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 transition-all shadow-md shadow-fuchsia-500/30"
                    >
                      Connect
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Stats Card 1: Light: bg-white border-gray-200, Dark: bg-gray-800/50 border-primary/10 */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-primary/10 rounded-xl p-6 shadow-md dark:shadow-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Database className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-black dark:text-white">{databases.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Connections</p>
                </div>
              </div>
            </div>
            {/* Stats Card 2 */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-primary/10 rounded-xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Database className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-black dark:text-white">{connectedCount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Connections</p>
                </div>
              </div>
            </div>
            {/* Stats Card 3 */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-primary/10 rounded-xl p-6 shadow-md dark:shadow-2xl hover:border-violet-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-500/20 rounded-xl">
                  <Database className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-black dark:text-white">{totalTables}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Schemas/Tables</p>
                </div>
              </div>
            </div>
            {/* Stats Card 4 */}
            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-primary/10 rounded-xl p-6 shadow-md dark:shadow-2xl hover:border-amber-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Database className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-black dark:text-white">{totalSize}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Data Size</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-full lg:max-w-xl">
              {/* Search Icon: Light: text-gray-400, Dark: text-gray-500 */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              {/* Input: Light: bg-white border-gray-300, Dark: bg-gray-800/70 border-primary/20 */}
              <Input
                placeholder="Search by connection name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-gray-300 dark:bg-gray-800/70 dark:border-primary/20 text-black dark:text-white focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Heading: Light: text-gray-800, Dark: text-gray-200 */}
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Active Connections</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredDatabases.map((db) => (
                  <DatabaseCard
                    key={db.id}
                    id={db.id}
                    name={db.name}
                    type={db.type}
                    status="connected"
                    tables={25}
                    size="850 MB"
                    host={`${db.host}:${db.port}`}
                    onDelete={() => handleDeleteDatabase(db.id, db.name)}
                    onTest={() => handleTestConnection(db.id, db.name)}
                  />
                ))}
              </div>

              {filteredDatabases.length === 0 && (
                // Empty State Border: Light: border-gray-300, Dark: border-gray-700
                <div className="text-center py-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl mt-8">
                  {/* Icon: Light: text-gray-400, Dark: text-gray-600 */}
                  <Database className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
                  {/* Heading: Light: text-gray-700, Dark: text-gray-200 */}
                  <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    {databases.length === 0 ? 'No connections yet' : 'No matching connections found'}
                  </h3>
                  {/* Text: Light: text-gray-500, Dark: text-gray-400 */}
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {databases.length === 0
                      ? 'Get started by adding your first database connection.'
                      : 'Try adjusting your search or create a new database connection.'}
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 transition-all shadow-xl shadow-fuchsia-500/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Connection
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;