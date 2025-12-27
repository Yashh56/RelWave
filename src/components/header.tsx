import React from 'react'
import { Plus, RefreshCw, Server, Sparkles, Database } from 'lucide-react'
import { ModeToggle } from './mode-toggle'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'

interface HeaderProps {
  refreshing: boolean
  handleRefresh: () => void
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  formData: {
    name: string
    type: string
    host: string
    port: string
    user: string
    password: string
    database: string
    sslmode: string
    ssl: boolean
  }
  handleInputChange: (field: string, value: string) => void
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string
      type: string
      host: string
      port: string
      user: string
      password: string
      database: string
      sslmode: string
      ssl: boolean
    }>
  >
  handleAddDatabase: () => void
}

const Header = ({
  refreshing,
  handleRefresh,
  isDialogOpen,
  setIsDialogOpen,
  formData,
  handleInputChange,
  setFormData,
  handleAddDatabase,
}: HeaderProps) => {
  return (
    <header className="relative border-b-2 border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur-xl sticky top-0 z-50 shadow-2xl shrink-0">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-full bg-gradient-to-r from-accent/10 to-transparent blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-75" />
              <div className="relative p-3 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl shadow-lg shadow-primary/30 border border-primary/30">
                <Server className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                DB Studio
              </h1>
              <p className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary/60" />
                Manage and visualize your connections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="group relative border-2 border-primary/30 text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-primary/50 transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="group relative hover:bg-gradient-to-r  hover:from-primary/10 transition-all duration-300 shadow-lg border border-primary/30 hover:scale-105 rounded-xl">
                  <Plus className="h-4 w-4" />
                  <span className="font-semibold">Add Connection</span>
                </Button>
              </DialogTrigger>

              {/* FIXED DIALOG */}
              <DialogContent className="sm:max-w-[550px] bg-background border-2 border-primary/20 rounded-2xl shadow-2xl  overflow-visible">
                {/* Background layers - FIXED */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full blur-2xl pointer-events-none z-0" />

                {/* Real content wrapper */}
                <div className="relative z-20">
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <DialogTitle className="text-2xl font-bold">
                        Add New Database Connection
                      </DialogTitle>
                    </div>
                    <DialogDescription>
                      Connect to a local, Docker, or remote database instance
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    {/* Connection Name */}
                    <div className="space-y-2">
                      <Label>Connection Name</Label>
                      <Input
                        placeholder="My Production DB"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>

                    {/* Database Type */}
                    <div className="space-y-2">
                      <Label>Database Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(val) => handleInputChange('type', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                        <SelectContent>
                          {['postgresql', 'mysql', 'mongodb', 'sqlite'].map((db) => (
                            <SelectItem key={db} value={db}>
                              {db.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Host & Port */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Host</Label>
                        <Input
                          placeholder="localhost"
                          value={formData.host}
                          onChange={(e) => handleInputChange('host', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Port</Label>
                        <Input
                          placeholder="5432"
                          value={formData.port}
                          onChange={(e) => handleInputChange('port', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Username & Password */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        <Input
                          placeholder="postgres"
                          value={formData.user}
                          onChange={(e) => handleInputChange('user', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Database Name */}
                    <div className="space-y-2">
                      <Label>Database Name</Label>
                      <Input
                        placeholder="myapp_db"
                        value={formData.database}
                        onChange={(e) => handleInputChange('database', e.target.value)}
                      />
                    </div>

                    {/* SSL */}
                    <div className="flex items-center gap-3 p-3 border rounded-xl bg-primary/5">
                      <Checkbox
                        checked={formData.ssl}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, ssl: checked as boolean }))
                        }
                      />
                      <Label className="cursor-pointer">Enable SSL Connection</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDatabase}>Connect</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
