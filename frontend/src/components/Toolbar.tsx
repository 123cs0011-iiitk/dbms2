import { Moon, Sun, Sparkles, Save, Database, ImageIcon, Beaker, PanelRightClose, PanelRightOpen, Circle, Settings, GitBranch } from 'lucide-react';

type ToolbarProps = {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPrompt: () => void;
  onExport: () => void;
  onOpenTest: () => void;
  onOpenSettings: () => void;
  onOpenMermaid: () => void;
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
  onOpenMermaid,
  onSaveSchema,
  onOpenSavedSchemas,
  hasEntities,
  showRightSidebar,
  onToggleRightSidebar,
}: ToolbarProps) {
  return (
    <div className="h-20 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Centered Navigation Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-full shadow-2xl px-6 py-3 flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-4 pr-4 border-r border-slate-600">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Circle className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
        
        {/* Navigation Items */}
        <button
          onClick={onOpenSavedSchemas}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group"
        >
          <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Work</span>
        </button>
        
        <button
          onClick={onOpenPrompt}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group"
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">About</span>
        </button>
        
        <button
          onClick={onOpenTest}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group"
        >
          <Beaker className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Playground</span>
        </button>
        
        <button
          onClick={onExport}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group"
        >
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Resource</span>
        </button>
        
        <button
          onClick={onSaveSchema}
          disabled={!hasEntities}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Save</span>
        </button>
        
        <button
          onClick={onOpenMermaid}
          disabled={!hasEntities}
          className="px-5 py-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitBranch className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-medium">ERD</span>
        </button>
        
        <div className="pl-4 ml-2 border-l border-slate-600 flex items-center gap-3">
          <button
            onClick={onToggleRightSidebar}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 flex items-center gap-2"
          >
            {showRightSidebar ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={onToggleDarkMode}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full transition-all duration-200 shadow-lg"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
