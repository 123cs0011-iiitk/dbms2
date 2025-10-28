import { Plus, Link2, Eye, EyeOff, Trash2, LayoutGrid, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type FloatingToolbarProps = {
  onAddEntity: () => void;
  onAddRelationship: () => void;
  onAutoLayout: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  showAttributes: boolean;
  onToggleAttributes: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export function FloatingToolbar({
  onAddEntity,
  onAddRelationship,
  onAutoLayout,
  onDelete,
  hasSelection,
  showAttributes,
  onToggleAttributes,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: FloatingToolbarProps) {
  return (
    <TooltipProvider>
      <motion.div
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onAddEntity}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Add Entity (Rectangle)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onAddRelationship}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link2 className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Add Relationship (Diamond)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onToggleAttributes}
              className={`h-11 w-11 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                showAttributes 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showAttributes ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
              {showAttributes ? 'Hide Attributes (Contracts Layout)' : 'Show Attributes (Expands Layout)'}
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onAutoLayout}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              <LayoutGrid className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Auto Layout</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onDelete}
              disabled={!hasSelection}
              className={`h-11 w-11 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                hasSelection
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              whileHover={hasSelection ? { scale: 1.1, rotate: -5 } : {}}
              whileTap={hasSelection ? { scale: 0.95 } : {}}
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Delete Selected</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onZoomIn}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ZoomIn className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Zoom In ({zoom}%)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onZoomOut}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ZoomOut className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Zoom Out ({zoom}%)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onZoomReset}
              className="h-11 w-11 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 shadow-lg transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 className="w-5 h-5" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Reset Zoom (100%)</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
