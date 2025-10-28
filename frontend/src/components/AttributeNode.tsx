import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Attribute } from '../App';
import { formatDisplayName } from '../utils/formatUtils';

type AttributeNodeProps = {
  attribute: Attribute;
  entityId: string;
  index: number;
  zoom: number;
  pan: { x: number; y: number };
  onMove?: (attributeId: string, x: number, y: number) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onAnimationComplete?: () => void;
};

export function AttributeNode({
  attribute,
  index,
  zoom,
  pan,
  onMove,
  onSelect,
  isSelected = false,
  onAnimationComplete
}: AttributeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already called the animation complete callback
  const hasCalledCallback = useRef(false);
  
  const scale = zoom / 100;
  
  // Use stored position from attribute with fallback to prevent rendering issues
  let x = attribute.customX ?? attribute.x;
  let y = attribute.customY ?? attribute.y;
  
  // Fallback: If position is invalid, use a safe default
  if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
    console.warn(`AttributeNode: Invalid position for "${attribute.name}", using fallback`);
    x = 0; // Will be positioned by layout system
    y = 0;
  }
  
  const position = customPosition || { x, y };

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

  // Calculate animation delay using GLOBAL index across all attributes
  const animationDelay = index * 0.1;
  const animationDuration = 0.3; // Duration of the spring animation in seconds
  
  // Log when this attribute node starts animating
  console.log(`🎭 AttributeNode "${attribute.name}" (GLOBAL index ${index}) starting animation with ${animationDelay.toFixed(1)}s delay`);
  
  // Call the animation complete callback after the animation finishes
  // Use a timer instead of relying on Framer Motion's onAnimationComplete
  // because it fires multiple times due to the infinite floating animation
  useEffect(() => {
    if (!hasCalledCallback.current && onAnimationComplete) {
      const totalDelay = (animationDelay + animationDuration) * 1000; // Convert to milliseconds
      
      console.log(`⏰ AttributeNode "${attribute.name}" (index ${index}) scheduling timer for ${totalDelay}ms`);
      
      const timer = setTimeout(() => {
        if (!hasCalledCallback.current) {
          console.log(`  ✅ AttributeNode "${attribute.name}" animation COMPLETE (timer-based)`);
          hasCalledCallback.current = true;
          onAnimationComplete();
        }
      }, totalDelay);
      
      return () => {
        console.log(`🗑️ Cleaning up timer for "${attribute.name}"`);
        clearTimeout(timer);
      };
    }
  }, [attribute.name, animationDelay, animationDuration, index]); // Removed onAnimationComplete to prevent useEffect re-triggering

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
        delay: animationDelay,
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
