import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Settings, Database, Terminal, AlertTriangle } from 'lucide-react';
import { resetDatabase } from '../services/api';
import { toast } from 'sonner';
import { SQLExecutor } from './SQLExecutor';

type SettingsModalProps = {
  onClose: () => void;
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [showSQLExecutor, setShowSQLExecutor] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const response = await resetDatabase();
      
      if (response.success) {
        toast.success('Database reset successfully! All tables and schemas have been cleared.');
        setShowResetDialog(false);
      } else {
        toast.error(response.message || 'Failed to reset database');
      }
    } catch (error: any) {
      console.error('Database reset error:', error);
      toast.error(error.message || 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  if (showSQLExecutor) {
    return <SQLExecutor onClose={() => setShowSQLExecutor(false)} />;
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#7aa2f7]" />
              Settings & Administration
            </DialogTitle>
            <DialogDescription>
              Manage database settings and advanced features.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="database" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Database Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your database and perform administrative tasks.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                      <div>
                        <h4 className="font-medium text-red-800">Reset Database</h4>
                        <p className="text-sm text-red-600">
                          Permanently delete all tables and saved schemas. This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => setShowResetDialog(true)}
                        className="flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Reset Database
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Database Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Database Type: SQLite</p>
                    <p>• Location: backend/data/database.sqlite</p>
                    <p>• AI Provider: Google Gemini (if configured)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Development Tools</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced tools for database development and debugging.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">SQL Executor</h4>
                        <p className="text-sm text-gray-600">
                          Execute custom SQL queries directly against the database.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowSQLExecutor(true)}
                        className="flex items-center gap-2"
                      >
                        <Terminal className="w-4 h-4" />
                        Open SQL Executor
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">API Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Backend Server: http://localhost:5000</p>
                    <p>• Frontend Server: http://localhost:5173</p>
                    <p>• CORS: Enabled for development</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Database Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Database Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>This action cannot be undone.</strong> This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All database tables and their data</li>
                <li>All saved schemas</li>
                <li>All relationships and constraints</li>
              </ul>
              <p className="font-medium text-red-600">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset Database'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
