import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Relationship } from '../App';
import { formatDisplayName } from '../utils/formatUtils';

type RelationshipNodeProps = {
  relationship: Relationship;
  isSelected: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onMove: (x: number, y: number) => void;
  onSelect: () => void;
};

export function RelationshipNode({
  relationship,
  isSelected,
  zoom,
  pan,
  onMove,
  onSelect
}: RelationshipNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const scale = zoom / 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - relationship.x * scale - pan.x,
      y: e.clientY - relationship.y * scale - pan.y,
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

  return (
    <motion.div
      ref={nodeRef}
      className={`absolute ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: relationship.x * scale + pan.x,
        top: relationship.y * scale + pan.y,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
      initial={{ scale: 0, opacity: 0, rotate: -45 }}
      animate={{ 
        scale: scale,
        opacity: 1,
        rotate: 0,
      }}
      whileHover={{ scale: scale * 1.05 }}
      transition={{ 
        delay: (relationship.animationIndex ?? 0) * 0.25, // Slower stagger animation for better visibility
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        opacity: { duration: 0.3 },
        rotate: { duration: 0.5 }
      }}
    >
      {/* ERD Relationship Diamond with Gradient */}
      <div className="w-[130px] h-[130px] flex items-center justify-center cursor-move">
        <div className="relative w-full h-full">
          <motion.div
            className={`w-full h-full transform rotate-45 rounded-xl transition-all duration-300 bg-gradient-to-br from-purple-400 to-pink-600 shadow-2xl ${
              isSelected
                ? 'ring-4 ring-white/50'
                : ''
            }`}
            style={{
              boxShadow: isSelected 
                ? '0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(168,85,247,0.5)' 
                : '0 10px 40px rgba(0,0,0,0.2)',
            }}
            animate={isSelected ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={isSelected ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span 
                className="transform -rotate-45 text-center font-bold text-white px-3 max-w-[110px] break-words drop-shadow-lg"
                style={{
                  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                  fontSize: '15px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {formatDisplayName(relationship.name)}
              </span>
            </div>
          </motion.div>
          
          {/* Animated glow effect when selected */}
          {isSelected && (
            <motion.div
              className="absolute inset-0 transform rotate-45 rounded-xl bg-gradient-to-br from-purple-400/30 to-pink-600/30 -z-10"
              animate={{
                scale: [1, 1.15, 1],
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
      </div>
    </motion.div>
  );
}
