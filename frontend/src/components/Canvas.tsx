import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EntityNode } from './EntityNode';
import { RelationshipNode } from './RelationshipNode';
import { AttributeNode } from './AttributeNode';
import type { Entity, Relationship } from '../App';
import type { Position } from '../utils/layoutUtils';

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

  // Calculate all attribute positions for collision detection
  const allAttributePositions = useMemo(() => {
    const positions = new Map<string, Position>();
    const seenIds = new Set<string>();
    
    entities.forEach((entity) => {
      entity.attributes?.forEach((attr, index) => {
        // Check for duplicate attribute IDs
        if (seenIds.has(attr.id)) {
          console.warn(`DUPLICATE ATTRIBUTE ID DETECTED: "${attr.id}" in entity "${entity.name}". This will cause incorrect connections!`);
        }
        seenIds.add(attr.id);
        
        let attrPosition: Position;
        if (attr.customX !== undefined && attr.customY !== undefined) {
          attrPosition = { x: attr.customX, y: attr.customY };
        } else {
          // Use improved circular position that matches AttributeNode.tsx and attributeLayout.ts
          const total = entity.attributes?.length || 1;
          const baseRadius = 190 + total * 10; // Match attributeLayout.ts config
          const radius = Math.min(Math.max(baseRadius, 150), 290); // Match attributeLayout.ts config
          
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
          const x = entity.x + 90 + Math.cos(angle) * radius;
          const y = entity.y + 35 + Math.sin(angle) * radius;
          
          attrPosition = { x, y };
        }
        
        positions.set(attr.id, attrPosition);
      });
    });
    
    return positions;
  }, [entities]);

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

  // Draw animated attribute connections with enhanced styling
  const renderAttributeConnections = () => {
    if (!showAttributes) return null;
    const scale = zoom / 100;
    
    const connections: React.ReactElement[] = [];
    
    entities.forEach((entity) => {
      entity.attributes?.forEach((attr, index) => {
        // Ensure this attribute belongs to this entity (safety check)
        if (!entity.attributes?.some(eAttr => eAttr.id === attr.id)) {
          console.error(`ERROR: Attribute ${attr.id} does not belong to entity ${entity.id}!`);
          return; // Skip this connection
        }
        
        // Use the centralized attribute position from allAttributePositions Map
        const attrPosition = allAttributePositions.get(attr.id);
        if (!attrPosition) {
          console.error(`ERROR: No position found for attribute ${attr.id}!`);
          return; // Skip this connection
        }
        
        // Calculate edge intersection points for cleaner connections
        const entityCenterX = entity.x + 90;
        const entityCenterY = entity.y + 35;
        const entityWidth = 180; // Entity width
        const entityHeight = 70; // Entity height
        
        // Calculate direction vector from entity center to attribute
        const dx = attrPosition.x - entityCenterX;
        const dy = attrPosition.y - entityCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const dirX = dx / distance;
        const dirY = dy / distance;
        
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
        // Ensure connection goes to the exact center of the attribute oval
        // The AttributeNode uses translate(-50%, -50%) to center itself at its position
        // So the connection should go to the position coordinates (which is the center)
        const attrCenterX = attrPosition.x * scale + pan.x;
        const attrCenterY = attrPosition.y * scale + pan.y;
        
        // Determine gradient based on attribute type and entity color
        let gradientId = 'gradient-attr-regular';
        if (attr.isPrimaryKey) {
          gradientId = 'gradient-attr-pk';
        } else if (attr.isForeignKey) {
          gradientId = 'gradient-attr-fk';
        }
        
        // Create entity-specific gradient for better visual association
        const entityGradientId = `gradient-entity-${entity.id}`;
        
        connections.push(
          <g key={`conn-${entity.id}-${attr.id}`}>
            {/* Glow effect for primary keys */}
            {attr.isPrimaryKey && (
              <motion.line
                x1={entityEdgeX}
                y1={entityEdgeY}
                x2={attrCenterX}
                y2={attrCenterY}
                stroke={`url(#${gradientId})`}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ 
                  duration: 1.0, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
              />
            )}
            {/* Main connection line from entity edge to attribute center */}
            <motion.line
              x1={entityEdgeX}
              y1={entityEdgeY}
              x2={attrCenterX}
              y2={attrCenterY}
              stroke={`url(#${entityGradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={attr.isPrimaryKey ? "0" : "6,3"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ 
                duration: 1.0, 
                delay: index * 0.15,
                ease: "easeOut"
              }}
            />
          </g>
        );
      });
    });
    
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
      {showAttributes && entities.map((entity) => (
        <React.Fragment key={`entity-attrs-${entity.id}`}>
          {entity.attributes?.map((attr, index) => (
            <AttributeNode
              key={attr.id}
              attribute={attr}
              entityId={entity.id}
              entityX={entity.x}
              entityY={entity.y}
              index={index}
              total={entity.attributes?.length || 1}
              zoom={zoom}
              pan={pan}
              onMove={onAttributeMove}
              onSelect={() => onSelectElement({ type: 'attribute', id: attr.id })}
              isSelected={selectedElement?.type === 'attribute' && selectedElement.id === attr.id}
            />
          ))}
        </React.Fragment>
      ))}

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
