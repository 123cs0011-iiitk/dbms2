import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Attribute } from '../App';
import { formatDisplayName } from '../utils/formatUtils';

type AttributeNodeProps = {
  attribute: Attribute;
  entityId: string;
  entityX: number;
  entityY: number;
  index: number;
  total: number;
  zoom: number;
  pan: { x: number; y: number };
  onMove?: (attributeId: string, x: number, y: number) => void;
  onSelect?: () => void;
  isSelected?: boolean;
};

export function AttributeNode({
  attribute,
  entityX,
  entityY,
  index,
  total,
  zoom,
  pan,
  onMove,
  onSelect,
  isSelected = false
}: AttributeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const scale = zoom / 100;
  
  // Simple positioning algorithm - returns world coordinates
  const getAttributePosition = () => {
    // Use custom position if available (from drag operations)
    if (customPosition) {
      return customPosition;
    }
    
    // Use saved custom position from attribute data
    if (attribute.customX !== undefined && attribute.customY !== undefined) {
      return { x: attribute.customX, y: attribute.customY };
    }
    
    // Use improved circular position that matches Canvas.tsx logic
    const baseRadius = 200 + total * 12; // Adjusted for properly proportioned nodes
    const radius = Math.min(Math.max(baseRadius, 160), 320); // Adjusted for properly proportioned nodes
    
    let angle;
    if (total === 1) {
      angle = Math.PI / 2; // Below entity
    } else if (total === 2) {
      angle = index === 0 ? Math.PI / 3 : (2 * Math.PI) / 3; // 60 and 120 degrees
    } else {
      // Distribute more evenly around the entity
      angle = (index * (360 / total)) * (Math.PI / 180);
    }
    
    // Ensure attributes are positioned relative to their parent entity only
    // Adjust for top-left transform origin (subtract half width/height for centering)
    const x = entityX + 90 + Math.cos(angle) * radius - 70; // -70 = half of 140px width
    const y = entityY + 35 + Math.sin(angle) * radius - 18; // -18 = half of 36px height
    
    return { x, y };
  };
  
  const position = getAttributePosition();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x * scale - pan.x,
      y: e.clientY - position.y * scale - pan.y,
    });
  };

  useEffect(() => {
    if (!isDragging || !onMove) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rawX = (e.clientX - dragStart.x - pan.x) / scale;
      const rawY = (e.clientY - dragStart.y - pan.y) / scale;
      
      // Allow free movement without collision detection
      setCustomPosition({ x: rawX, y: rawY });
      onMove(attribute.id, rawX, rawY);
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
  }, [isDragging, dragStart, pan, scale, onMove, attribute.id]);

  const getGradient = () => {
    if (attribute.isPrimaryKey) {
      return 'from-yellow-300 to-yellow-500';
    } else if (attribute.isForeignKey) {
      return 'from-blue-300 to-blue-500';
    } else {
      return 'from-emerald-300 to-teal-500';
    }
  };

  return (
    <motion.div
      ref={nodeRef}
      className={`absolute ${isDragging ? 'z-50' : 'z-5'}`}
      style={{
        left: position.x * scale + pan.x,
        top: position.y * scale + pan.y,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: scale,
        opacity: 1,
        y: [0, -4, 0],
      }}
      whileHover={{ scale: scale * 1.05 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 25,
        opacity: { duration: 0.3 },
        y: {
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: index * 0.2,
          ease: "easeInOut"
        },
      }}
    >

      {/* ERD Attribute Ellipse with Gradient */}
      <div className="relative">
        <div
          className={`rounded-full shadow-xl bg-gradient-to-br ${getGradient()} backdrop-blur-sm cursor-move transition-all duration-300 ${
            isSelected ? 'ring-2 ring-white/70' : 'hover:shadow-2xl'
          }`}
          style={{
            width: '140px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            boxShadow: isSelected 
              ? '0 12px 40px rgba(0,0,0,0.3)' 
              : '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <span 
            className={`text-white drop-shadow-md whitespace-nowrap ${
              attribute.isPrimaryKey ? 'underline decoration-2 underline-offset-2' : ''
            }`}
            style={{
              fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {formatDisplayName(attribute.name)}
          </span>
        </div>
        
        {/* Subtle glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${getGradient()} opacity-50 -z-10 blur-md`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2
          }}
        />
      </div>
    </motion.div>
  );
}
