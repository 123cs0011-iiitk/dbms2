import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EntityNode } from './EntityNode';
import { RelationshipNode } from './RelationshipNode';
import { AttributeNode } from './AttributeNode';
import type { Entity, Relationship } from '../App';

type CanvasProps = {
  entities: Entity[];
  relationships: Relationship[];
  selectedElement: { type: 'entity' | 'relationship' | 'attribute'; id: string } | null;
  zoom: number;
  onEntityMove: (id: string, x: number, y: number) => void;
  onRelationshipMove: (id: string, x: number, y: number) => void;
  onAttributeMove?: (attributeId: string, x: number, y: number) => void;
  onSelectElement: (element: { type: 'entity' | 'relationship' | 'attribute'; id: string } | null) => void;
  showAttributes: boolean;
};

export function Canvas({
  entities,
  relationships,
  selectedElement,
  zoom,
  onEntityMove,
  onRelationshipMove,
  onAttributeMove,
  onSelectElement,
  showAttributes,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Track whether all attribute animations have completed
  const [attributeAnimationComplete, setAttributeAnimationComplete] = useState(false);
  
  // Track animation completion using refs (don't cause re-renders on increment)
  const animationCompleteCount = useRef(0);
  const totalExpectedAnimations = useRef(0);

  // No longer need useMemo - attributes have stored x, y coordinates!
  
  // Reset animation tracking when attributes are toggled
  // NOTE: Don't include entities in dependencies to avoid race conditions
  // where counter resets mid-animation
  useEffect(() => {
    if (!showAttributes) {
      setAttributeAnimationComplete(false);
      animationCompleteCount.current = 0;
      totalExpectedAnimations.current = 0;
      return;
    }
    
    // Count total attributes
    const totalAttributes = entities.reduce((sum, entity) => sum + (entity.attributes?.length || 0), 0);
    
    console.log(`🎬 Resetting animation tracking for ${totalAttributes} attributes`);
    console.log(`🔍 Entity breakdown:`, entities.map(e => ({ name: e.name, attrCount: e.attributes?.length || 0 })));
    
    // If no attributes, show lines immediately
    if (totalAttributes === 0) {
      setAttributeAnimationComplete(true);
      return;
    }
    
    // Reset counter for new animation cycle
    totalExpectedAnimations.current = totalAttributes;
    animationCompleteCount.current = 0;
    setAttributeAnimationComplete(false);
    
    console.log(`🎬 Starting animation tracking for ${totalAttributes} attributes`);
  }, [showAttributes]); // Removed 'entities' dependency to prevent race conditions
  
  // Callback for when an attribute animation completes
  const handleAttributeAnimationComplete = useCallback(() => {
    const previousCount = animationCompleteCount.current;
    animationCompleteCount.current += 1;
    console.log(`✅ Animation complete callback #${animationCompleteCount.current}/${totalExpectedAnimations.current}`);
    console.log(`  Counter: ${previousCount} → ${animationCompleteCount.current}`);
    
    // When all animations are complete, show lines
    if (animationCompleteCount.current >= totalExpectedAnimations.current) {
      console.log('🎉 All attribute animations complete - rendering connection lines');
      console.log(`  Setting attributeAnimationComplete to true`);
      setAttributeAnimationComplete(true);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  // When an attribute is moved during animation, force immediate line rendering
  const handleAttributeMove = (attributeId: string, x: number, y: number) => {
    // If lines aren't showing yet but user is dragging, force immediate rendering
    if (!attributeAnimationComplete) {
      console.log('🎯 Attribute dragged during animation - forcing immediate line rendering');
      setAttributeAnimationComplete(true);
    }
    onAttributeMove?.(attributeId, x, y);
  };

  // Draw animated attribute connections with enhanced styling
  const renderAttributeConnections = () => {
    if (!showAttributes) return null;
    const scale = zoom / 100;
    
    const connections: React.ReactElement[] = [];
    
    // Count total attributes for logging
    const totalAttributes = entities.reduce((sum, entity) => sum + (entity.attributes?.length || 0), 0);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔗 renderAttributeConnections: Starting render for ${totalAttributes} total attributes across ${entities.length} entities`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Track all attributes and their line status
    const attributeDebug: any[] = [];
    
    let globalIndex = 0;
    entities.forEach((entity) => {
      const attrCount = entity.attributes?.length || 0;
      if (attrCount > 0) {
        console.log(`\n  📦 Entity "${entity.name}": Processing ${attrCount} attributes`);
      }
      
      entity.attributes?.forEach((attr, index) => {
        console.log(`🔍 [Entity "${entity.name}"] Processing attribute ${index + 1}/${attrCount}: "${attr.name}"`);
        
        // Use stored position from attribute with fallback
        let attrX = attr.customX ?? attr.x;
        let attrY = attr.customY ?? attr.y;
        
        // CRITICAL FIX: If position is invalid, calculate a VALID position using entity position
        if (attrX === undefined || attrY === undefined || isNaN(attrX) || isNaN(attrY) || 
            entity.x === undefined || entity.y === undefined || isNaN(entity.x) || isNaN(entity.y)) {
          console.warn(`⚠️ Attribute "${attr.name}" has invalid position, calculating fallback`, { 
            customX: attr.customX, 
            x: attr.x, 
            customY: attr.customY, 
            y: attr.y,
            entityX: entity.x,
            entityY: entity.y
          });
          
          // Ensure entity position is valid
          const validEntityX = (entity.x !== undefined && !isNaN(entity.x)) ? entity.x : 100;
          const validEntityY = (entity.y !== undefined && !isNaN(entity.y)) ? entity.y : 100;
          
          // Calculate position around entity
          const total = entity.attributes?.length || 1;
          const baseRadius = 200 + total * 12;
          const radius = Math.min(Math.max(baseRadius, 160), 320);
          const angle = (index * (360 / total)) * (Math.PI / 180);
          attrX = validEntityX + 90 + Math.cos(angle) * radius - 70;
          attrY = validEntityY + 35 + Math.sin(angle) * radius - 18;
          
          console.log(`  ✓ Calculated fallback position: (${Math.round(attrX)}, ${Math.round(attrY)})`);
        }
        
        const attrPosition = { x: attrX, y: attrY };
        
        // Calculate edge intersection points for cleaner connections
        // Use valid entity position (fallback to 100 if invalid)
        const entityCenterX = ((entity.x !== undefined && !isNaN(entity.x)) ? entity.x : 100) + 90;
        const entityCenterY = ((entity.y !== undefined && !isNaN(entity.y)) ? entity.y : 100) + 35;
        const entityWidth = 180; // Entity width
        const entityHeight = 70; // Entity height
        
        // Calculate direction vector from entity center to attribute center
        const attrCenterWorldX = attrPosition.x + 70; // +70 = half of 140px width
        const attrCenterWorldY = attrPosition.y + 18; // +18 = half of 36px height
        const dx = attrCenterWorldX - entityCenterX;
        const dy = attrCenterWorldY - entityCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // CRITICAL FIX: If distance is 0 or infinite, use a safe default
        const safeDistance = (distance > 0 && isFinite(distance)) ? distance : 100;
        
        // Normalize direction vector (with safety check for zero distance)
        const dirX = safeDistance > 0 ? dx / safeDistance : 1;
        const dirY = safeDistance > 0 ? dy / safeDistance : 0;
        
        // Calculate intersection point on entity edge
        const halfWidth = entityWidth / 2;
        const halfHeight = entityHeight / 2;
        
        // Find which edge the line intersects
        const tX = Math.abs(dirX) > 0 ? halfWidth / Math.abs(dirX) : Infinity;
        const tY = Math.abs(dirY) > 0 ? halfHeight / Math.abs(dirY) : Infinity;
        const t = Math.min(tX, tY);
        
        const edgeX = entityCenterX + dirX * t;
        const edgeY = entityCenterY + dirY * t;
        
        // Convert to screen coordinates
        const entityEdgeX = edgeX * scale + pan.x;
        const entityEdgeY = edgeY * scale + pan.y;
        // Convert attribute center to screen coordinates
        const attrCenterX = attrCenterWorldX * scale + pan.x;
        const attrCenterY = attrCenterWorldY * scale + pan.y;
        
        // Determine gradient based on attribute type and entity color
        let gradientId = 'gradient-attr-regular';
        if (attr.isPrimaryKey) {
          gradientId = 'gradient-attr-pk';
        } else if (attr.isForeignKey) {
          gradientId = 'gradient-attr-fk';
        }
        
        // Create entity-specific gradient for better visual association
        const entityGradientId = `gradient-entity-${entity.id}`;
        
        // Debug tracking
        const debugInfo = {
          entity: entity.name,
          attribute: attr.name,
          globalIndex,
          localIndex: index,
          hasCustomX: attr.customX !== undefined,
          hasCustomY: attr.customY !== undefined,
          hasX: attr.x !== undefined,
          hasY: attr.y !== undefined,
          finalX: attrX,
          finalY: attrY,
          entityCenterX,
          entityCenterY,
          lineCreated: true
        };
        attributeDebug.push(debugInfo);
        
        // Log each attribute as it's about to animate
        console.log(`🎨 [${globalIndex}] "${entity.name}.${attr.name}" → Line at (${Math.round(entityEdgeX)},${Math.round(entityEdgeY)}) to (${Math.round(attrCenterX)},${Math.round(attrCenterY)})`);
        
        // CRITICAL FIX: Use index instead of attr.id to avoid duplicate React keys
        connections.push(
          <g key={`conn-${entity.id}-${index}`}>
            {/* Glow effect for primary keys */}
            {attr.isPrimaryKey && (
              <line
                x1={entityEdgeX}
                y1={entityEdgeY}
                x2={attrCenterX}
                y2={attrCenterY}
                stroke={`url(#${gradientId})`}
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.3"
              />
            )}
            {/* Main connection line from entity edge to attribute center */}
            <line
              x1={entityEdgeX}
              y1={entityEdgeY}
              x2={attrCenterX}
              y2={attrCenterY}
              stroke={`url(#${entityGradientId})`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={attr.isPrimaryKey ? "0" : "6,3"}
              opacity="0.9"
            />
          </g>
        );
        
        globalIndex++;
      });
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ renderAttributeConnections: Successfully created ${connections.length} connection line elements`);
    console.log(`📊 SUMMARY:`);
    console.log(`   - Total attributes found: ${totalAttributes}`);
    console.log(`   - Total lines created: ${connections.length}`);
    console.log(`   - Match: ${totalAttributes === connections.length ? '✅ YES' : '❌ NO - MISMATCH!'}`);
    
    // Show detailed table
    console.table(attributeDebug.map(d => ({
      Entity: d.entity,
      Attribute: d.attribute,
      Index: d.globalIndex,
      'Custom Pos': d.hasCustomX && d.hasCustomY ? 'YES' : 'NO',
      'Base Pos': d.hasX && d.hasY ? 'YES' : 'NO',
      'Final X': Math.round(d.finalX),
      'Final Y': Math.round(d.finalY),
      'Line': d.lineCreated ? '✅' : '❌'
    })));
    
    console.log(`${'='.repeat(80)}\n`);
    return connections;
  };

  // Draw animated relationship connections with straight lines
  const renderRelationshipConnections = () => {
    const scale = zoom / 100;
    
    return relationships.map((rel, relIndex) => {
      const fromEntity = entities.find(e => e.id === rel.fromEntityId);
      const toEntity = entities.find(e => e.id === rel.toEntityId);
      
      if (!fromEntity || !toEntity) return null;

      // Entity center points
      const fromX = (fromEntity.x + 90) * scale + pan.x;
      const fromY = (fromEntity.y + 35) * scale + pan.y;
      
      // Relationship center point
      const relX = (rel.x + 65) * scale + pan.x;
      const relY = (rel.y + 65) * scale + pan.y;
      
      // To entity center points
      const toX = (toEntity.x + 90) * scale + pan.x;
      const toY = (toEntity.y + 35) * scale + pan.y;

      return (
        <g key={rel.id}>
          {/* Straight line from fromEntity to relationship diamond */}
          <motion.line
            x1={fromX}
            y1={fromY}
            x2={relX}
            y2={relY}
            stroke="url(#gradient1)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: relIndex * 0.2 }}
          />
          
          {/* Straight line from relationship diamond to toEntity */}
          <motion.line
            x1={relX}
            y1={relY}
            x2={toX}
            y2={toY}
            stroke="url(#gradient2)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: relIndex * 0.2 + 0.3 }}
          />
          
          {/* Cardinality labels with backgrounds - centered at midpoint */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: relIndex * 0.2 + 0.6 }}
          >
            <rect
              x={fromX + (relX - fromX) * 0.5 - 15}
              y={fromY + (relY - fromY) * 0.5 - 15}
              width="30"
              height="24"
              rx="8"
              fill="white"
              className="dark:fill-slate-800"
              opacity="0.95"
            />
            <text
              x={fromX + (relX - fromX) * 0.5}
              y={fromY + (relY - fromY) * 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-blue-600 dark:fill-blue-400 font-bold"
              style={{ 
                fontSize: '13px',
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
              }}
            >
              {rel.fromCardinality || '1'}
            </text>
          </motion.g>
          
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: relIndex * 0.2 + 0.7 }}
          >
            <rect
              x={relX + (toX - relX) * 0.5 - 15}
              y={relY + (toY - relY) * 0.5 - 15}
              width="30"
              height="24"
              rx="8"
              fill="white"
              className="dark:fill-slate-800"
              opacity="0.95"
            />
            <text
              x={relX + (toX - relX) * 0.5}
              y={relY + (toY - relY) * 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-purple-600 dark:fill-purple-400 font-bold"
              style={{ 
                fontSize: '13px',
                fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
              }}
            >
              {rel.toCardinality || rel.cardinality?.split(':')[1] || 'N'}
            </text>
          </motion.g>
        </g>
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Gradient background */}
      <div
        className="canvas-bg absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
        style={{
          backgroundImage: `radial-gradient(circle, ${
            document.documentElement.classList.contains('dark') ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.4)'
          } 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* SVG layer for relationship connections with gradients */}
      <svg
        key={`svg-${attributeAnimationComplete}`}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Relationship gradients */}
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Attribute connection gradients */}
          <linearGradient id="gradient-attr-pk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="gradient-attr-fk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="gradient-attr-regular" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Entity-specific gradients for better visual association */}
          {entities.map(entity => (
            <linearGradient key={`entity-gradient-${entity.id}`} id={`gradient-entity-${entity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={entity.color || '#7aa2f7'} stopOpacity="0.7" />
              <stop offset="100%" stopColor={entity.color || '#7aa2f7'} stopOpacity="0.9" />
            </linearGradient>
          ))}
        </defs>
        {renderAttributeConnections()}
        {renderRelationshipConnections()}
      </svg>

      {/* Attributes (ellipses - optional) */}
      {showAttributes && (() => {
        let globalAttrIndex = 0;
        return entities.map((entity) => (
          <React.Fragment key={`entity-attrs-${entity.id}`}>
            {entity.attributes?.map((attr, attrIndex) => {
              const currentGlobalIndex = globalAttrIndex++;
              return (
                <AttributeNode
                  key={`attr-${entity.id}-${attrIndex}`}
                  attribute={attr}
                  entityId={entity.id}
                  index={currentGlobalIndex}
                  zoom={zoom}
                  pan={pan}
                  onMove={handleAttributeMove}
                  onSelect={() => onSelectElement({ type: 'attribute', id: attr.id })}
                  isSelected={selectedElement?.type === 'attribute' && selectedElement.id === attr.id}
                  onAnimationComplete={handleAttributeAnimationComplete}
                />
              );
            })}
          </React.Fragment>
        ));
      })()}

      {/* Entities (rectangles) */}
      {entities.map((entity) => (
        <EntityNode
          key={entity.id}
          entity={entity}
          isSelected={selectedElement?.type === 'entity' && selectedElement.id === entity.id}
          zoom={zoom}
          pan={pan}
          onMove={(x, y) => onEntityMove(entity.id, x, y)}
          onSelect={() => onSelectElement({ type: 'entity', id: entity.id })}
        />
      ))}

      {/* Relationships (diamonds) */}
      {relationships.map((rel) => (
        <RelationshipNode
          key={rel.id}
          relationship={rel}
          isSelected={selectedElement?.type === 'relationship' && selectedElement.id === rel.id}
          zoom={zoom}
          pan={pan}
          onMove={(x, y) => onRelationshipMove(rel.id, x, y)}
          onSelect={() => onSelectElement({ type: 'relationship', id: rel.id })}
        />
      ))}
    </div>
  );
}
