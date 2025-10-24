import { Database, Table } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'er-diagram' | 'table';

type ViewModeToggleProps = {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-200 dark:bg-slate-700 rounded-xl p-1 shadow-inner">
      <motion.button
        onClick={() => onModeChange('er-diagram')}
        className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
          mode === 'er-diagram'
            ? 'text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
        whileHover={{ scale: mode === 'er-diagram' ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {mode === 'er-diagram' && (
          <motion.div
            layoutId="activeMode"
            className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Database className="w-4 h-4 relative z-10" />
        <span className="relative z-10">ER Diagram</span>
      </motion.button>

      <motion.button
        onClick={() => onModeChange('table')}
        className={`relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
          mode === 'table'
            ? 'text-white'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
        }`}
        whileHover={{ scale: mode === 'table' ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {mode === 'table' && (
          <motion.div
            layoutId="activeMode"
            className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg shadow-lg"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Table className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Tables</span>
      </motion.button>
    </div>
  );
}

