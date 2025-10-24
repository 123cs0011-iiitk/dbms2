import { Database, Link2, AlertCircle, CheckCircle2, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type StatusBarProps = {
  entityCount: number;
  relationshipCount: number;
  hasUnsavedChanges: boolean;
  zoom: number;
  showSqlPreview: boolean;
  onToggleSqlPreview: () => void;
  hasSqlCode: boolean;
};

export function StatusBar({
  entityCount,
  relationshipCount,
  hasUnsavedChanges,
  zoom,
  showSqlPreview,
  onToggleSqlPreview,
  hasSqlCode,
}: StatusBarProps) {
  return (
    <TooltipProvider>
      <motion.div
        className="h-10 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 flex items-center px-6 gap-8 text-white shadow-lg"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-400" />
        <span className="font-medium text-sm">
          {entityCount} {entityCount === 1 ? 'Entity' : 'Entities'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-purple-400" />
        <span className="font-medium text-sm">
          {relationshipCount} {relationshipCount === 1 ? 'Relationship' : 'Relationships'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {hasUnsavedChanges ? (
          <>
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">Unsaved changes</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium text-sm">All changes saved</span>
          </>
        )}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="font-medium text-sm text-emerald-400">Connected</span>
      </div>
      
      <div className="text-gray-300 font-medium text-sm">
        Zoom: {zoom}%
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onToggleSqlPreview}
            className={`h-7 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              showSqlPreview
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Code className="w-4 h-4" />
            <span className="text-xs font-medium">SQL</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-medium">
          <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            {hasSqlCode ? 'Toggle SQL Preview' : 'Generate & Show SQL'}
          </p>
        </TooltipContent>
      </Tooltip>
    </motion.div>
    </TooltipProvider>
  );
}
