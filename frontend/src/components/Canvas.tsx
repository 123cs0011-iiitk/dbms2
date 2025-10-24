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
          // Use improved circular position that ensures attributes stay close to their parent entity
          const total = entity.attributes?.length || 1;
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
          const x = entity.x + 90 + Math.cos(angle) * radius;
          const y = entity.y + 35 + Math.sin(angle) * radius;
          
          attrPosition = { x, y };
        }
        
        positions.set(attr.id, attrPosition);
        
        // Also add positions for sub-attributes if this is a composite attribute
        if (attr.isComposite && attr.subAttributes) {
          attr.subAttributes.forEach((subAttr) => {
            if (subAttr.customX !== undefined && subAttr.customY !== undefined) {
              positions.set(subAttr.id, { x: subAttr.customX, y: subAttr.customY });
              seenIds.add(subAttr.id);
            }
          });
        }
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

  // Draw connections from composite attributes to sub-attributes
  const renderSubAttributeConnections = () => {
    if (!showAttributes) return null;
    const scale = zoom / 100;
    
    const connections: React.ReactElement[] = [];
    
    entities.forEach((entity) => {
      entity.attributes?.forEach((attr) => {
        // Only process composite attributes with sub-attributes
        if (!attr.isComposite || !attr.subAttributes || attr.subAttributes.length === 0) {
          return;
        }
        
        const parentPosition = allAttributePositions.get(attr.id);
        if (!parentPosition) return;
        
        const parentX = parentPosition.x * scale + pan.x;
        const parentY = parentPosition.y * scale + pan.y;
        
        // Draw connections to each sub-attribute
        attr.subAttributes.forEach((subAttr, subIndex) => {
          const subPosition = allAttributePositions.get(subAttr.id);
          if (!subPosition) return;
          
          const subX = subPosition.x * scale + pan.x;
          const subY = subPosition.y * scale + pan.y;
          
          connections.push(
            <motion.line
              key={`sub-conn-${attr.id}-${subAttr.id}`}
              x1={parentX}
              y1={parentY}
              x2={subX}
              y2={subY}
              stroke="url(#gradient-composite)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4,2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ 
                duration: 0.8, 
                delay: subIndex * 0.1 + 0.3,
                ease: "easeOut"
              }}
            />
          );
        });
      });
    });
    
    return connections;
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

  // Draw animated relationship connections
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
          {/* Animated gradient line from fromEntity to relationship diamond */}
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
          
          {/* Animated gradient line from relationship diamond to toEntity */}
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
          
          {/* Cardinality labels with backgrounds */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: relIndex * 0.2 + 0.6 }}
          >
            <rect
              x={fromX + (relX - fromX) * 0.25 - 15}
              y={fromY + (relY - fromY) * 0.25 - 15}
              width="30"
              height="24"
              rx="8"
              fill="white"
              className="dark:fill-slate-800"
              opacity="0.95"
            />
            <text
              x={fromX + (relX - fromX) * 0.25}
              y={fromY + (relY - fromY) * 0.25}
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
              x={relX + (toX - relX) * 0.75 - 15}
              y={relY + (toY - relY) * 0.75 - 15}
              width="30"
              height="24"
              rx="8"
              fill="white"
              className="dark:fill-slate-800"
              opacity="0.95"
            />
            <text
              x={relX + (toX - relX) * 0.75}
              y={relY + (toY - relY) * 0.75}
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
          <linearGradient id="gradient-composite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
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
        {renderSubAttributeConnections()}
        {renderRelationshipConnections()}
      </svg>

      {/* Attributes (ellipses - optional) */}
      {showAttributes && entities.map((entity) => (
        <React.Fragment key={`entity-attrs-${entity.id}`}>
          {entity.attributes?.map((attr, index) => (
            <React.Fragment key={attr.id}>
              <AttributeNode
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
                allAttributePositions={allAttributePositions}
                entities={entities}
                relationships={relationships}
              />
              {/* Render sub-attributes for composite attributes */}
              {attr.isComposite && attr.subAttributes && attr.subAttributes.map((subAttr, subIndex) => {
                const parentPos = allAttributePositions.get(attr.id);
                if (!parentPos) return null;
                
                return (
                  <AttributeNode
                    key={subAttr.id}
                    attribute={subAttr}
                    entityId={entity.id}
                    entityX={parentPos.x - 70} // Offset from parent attribute position
                    entityY={parentPos.y - 20}
                    index={subIndex}
                    total={attr.subAttributes?.length || 1}
                    zoom={zoom}
                    pan={pan}
                    onMove={onAttributeMove}
                    onSelect={() => onSelectElement({ type: 'attribute', id: subAttr.id })}
                    isSelected={selectedElement?.type === 'attribute' && selectedElement.id === subAttr.id}
                    allAttributePositions={allAttributePositions}
                    entities={entities}
                    relationships={relationships}
                  />
                );
              })}
            </React.Fragment>
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
          entities={entities}
          relationships={relationships}
          attributePositions={allAttributePositions}
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
          entities={entities}
          relationships={relationships}
          attributePositions={allAttributePositions}
        />
      ))}
    </div>
  );
}
