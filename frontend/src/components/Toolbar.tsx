import { Moon, Sun, Sparkles, Save, Database, ImageIcon, Beaker, PanelRightClose, PanelRightOpen, Settings, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type ToolbarProps = {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPrompt: () => void;
  onExport: () => void;
  onOpenTest: () => void;
  onOpenSettings: () => void;
  onSaveSchema: () => void;
  onOpenSavedSchemas: () => void;
  hasEntities: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
};

export function Toolbar({
  isDarkMode,
  onToggleDarkMode,
  onOpenPrompt,
  onExport,
  onOpenTest,
  onOpenSettings,
  onSaveSchema,
  onOpenSavedSchemas,
  hasEntities,
  showRightSidebar,
  onToggleRightSidebar,
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="h-20 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Centered Navigation Bar */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2 border border-gray-200 dark:border-gray-700"
          style={{
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mr-2 pr-4 border-r border-gray-300 dark:border-slate-600">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {/* Navigation Items */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenSavedSchemas}
                className="h-11 px-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Database className="w-4 h-4" />
                <span className="font-medium">Work</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Open Saved Schemas</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenPrompt}
                className="h-11 px-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Create</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Generate Schema with AI</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenTest}
                className="h-11 px-4 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-black dark:text-gray-200 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Beaker className="w-4 h-4" />
                <span className="font-medium">Playground</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Load Sample Diagrams</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onExport}
                className="h-11 px-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="font-medium">Resource</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Export Diagram</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onSaveSchema}
                disabled={!hasEntities}
                className={`h-11 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  hasEntities
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                whileHover={hasEntities ? { scale: 1.05 } : {}}
                whileTap={hasEntities ? { scale: 0.95 } : {}}
              >
                <Save className="w-4 h-4" />
                <span className="font-medium">Save</span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Save Current Schema</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="h-px w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent mx-2 self-stretch" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleRightSidebar}
                className="h-11 w-11 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-black dark:text-gray-200 shadow-lg transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {showRightSidebar ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRightOpen className="w-5 h-5" />
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                {showRightSidebar ? 'Hide' : 'Show'} Sidebar
              </p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onOpenSettings}
                className="h-11 w-11 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-black dark:text-gray-200 shadow-lg transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Settings</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onToggleDarkMode}
                className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-medium">
              <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                {isDarkMode ? 'Light' : 'Dark'} Mode
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
