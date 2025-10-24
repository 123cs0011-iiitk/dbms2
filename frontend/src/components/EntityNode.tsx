import { useState, useRef, useEffect } from 'react';
import { Key } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Entity } from '../App';
import { formatDisplayName } from '../utils/formatUtils';

type EntityNodeProps = {
  entity: Entity;
  isSelected: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onMove: (x: number, y: number) => void;
  onSelect: () => void;
};

export function EntityNode({ 
  entity, 
  isSelected, 
  zoom, 
  pan, 
  onMove, 
  onSelect
}: EntityNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const scale = zoom / 100;
  const hasPrimaryKey = entity.attributes?.some(attr => attr.isPrimaryKey);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - entity.x * scale - pan.x,
      y: e.clientY - entity.y * scale - pan.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragStart.x - pan.x) / scale;
      const newY = (e.clientY - dragStart.y - pan.y) / scale;
      
      // Allow free movement without collision detection
      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, pan, scale, onMove]);

  const gradientColors = {
    '#7aa2f7': 'from-blue-400 to-blue-600',
    '#9ece6a': 'from-green-400 to-green-600',
    '#bb9af7': 'from-purple-400 to-purple-600',
    '#f7768e': 'from-pink-400 to-pink-600',
    '#7dcfff': 'from-cyan-400 to-cyan-600',
    '#e0af68': 'from-amber-400 to-amber-600',
  };

  const gradient = gradientColors[entity.color as keyof typeof gradientColors] || 'from-blue-400 to-blue-600';

  return (
    <motion.div
      ref={nodeRef}
      className={`absolute ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: entity.x * scale + pan.x,
        top: entity.y * scale + pan.y,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ 
        scale: scale,
        opacity: 1,
        y: 0,
      }}
      whileHover={{ scale: scale * 1.02 }}
      transition={{ 
        delay: (entity.animationIndex ?? 0) * 0.25, // Slower stagger animation for better visibility
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        opacity: { duration: 0.3 },
        y: { duration: 0.4 }
      }}
    >
      {/* ERD Entity Rectangle with Gradient */}
      <div className="relative">
        <div
          className={`min-w-[180px] px-8 py-5 rounded-2xl transition-all duration-300 cursor-move bg-gradient-to-br shadow-2xl ${gradient} ${
            isSelected
              ? 'ring-4 ring-white/50 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
              : 'hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]'
          }`}
          style={{
            boxShadow: isSelected 
              ? '0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(59,130,246,0.5)' 
              : '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center justify-center gap-2.5">
            {hasPrimaryKey && (
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Key className="w-4 h-4 text-yellow-300 drop-shadow-lg flex-shrink-0" />
              </motion.div>
            )}
            <span 
              className="text-center font-bold text-white drop-shadow-lg text-lg tracking-wide"
              style={{
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                textDecoration: 'none',
              }}
            >
              {formatDisplayName(entity.name)}
            </span>
          </div>
        </div>
        
        {/* Animated glow effect when selected */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-600/20 -z-10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
