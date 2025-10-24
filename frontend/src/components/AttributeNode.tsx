import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Attribute } from '../App';
import { 
  isPositionValid,
  createCollisionElements,
  type Position
} from '../utils/layoutUtils';
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
  allAttributePositions?: Map<string, Position>;
  entities?: any[];
  relationships?: any[];
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
  isSelected = false,
  allAttributePositions,
  entities = [],
  relationships = [],
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
    const baseRadius = Math.max(60, 50 + total * 5); // Much smaller radius to keep closer to parent
    const radius = Math.min(baseRadius, 100); // Reduced max radius
    
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
    const x = entityX + 90 + Math.cos(angle) * radius;
    const y = entityY + 35 + Math.sin(angle) * radius;
    
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
      
      const intendedPosition = { x: rawX, y: rawY };
      
      // Create collision elements for hard collision detection
      const collisionElements = createCollisionElements(entities, relationships, allAttributePositions);
      
      // Check if the intended position is valid (no collisions)
      const isValid = isPositionValid(
        attribute.id,
        'attribute',
        intendedPosition,
        collisionElements
      );
      
      // Only update position if it's valid (no collision)
      if (isValid) {
        setCustomPosition(intendedPosition);
        onMove(attribute.id, intendedPosition.x, intendedPosition.y);
      }
      // If collision detected, don't update - element stays at last valid position
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
  }, [isDragging, dragStart, pan, scale, onMove, attribute.id, allAttributePositions, entities, relationships]);

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
      className={`absolute z-5 ${isDragging ? 'z-50' : 'z-5'}`}
      style={{
        left: position.x * scale + pan.x,
        top: position.y * scale + pan.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
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
        scale: { duration: 0.4, delay: index * 0.1 },
        opacity: { duration: 0.4, delay: index * 0.1 },
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
          className={`px-16 py-4 min-w-[140px] rounded-full shadow-xl bg-gradient-to-br ${getGradient()} text-sm backdrop-blur-sm cursor-move transition-all duration-300 ${
            isSelected ? 'ring-2 ring-white/70' : 'hover:shadow-2xl'
          }`}
          style={{
            boxShadow: isSelected 
              ? '0 12px 40px rgba(0,0,0,0.3)' 
              : '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <span 
            className={`text-white font-semibold drop-shadow-md whitespace-nowrap ${
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
