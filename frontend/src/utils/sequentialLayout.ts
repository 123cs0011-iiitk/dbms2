import type { Entity, Relationship } from '../App';

interface PlacedEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

// Entity dimensions with extra padding for safe spacing
const ENTITY_WIDTH = 180;
const ENTITY_HEIGHT = 70;

// Compact spacing parameters - minimized for tighter layout
const MIN_SPACING = 200; // Reduced gap while still accommodating relationship diamonds
const RADIUS_STEP = 220; // Reduced distance between spiral rings
const COLLISION_PADDING = 40; // Reduced padding for collision detection
const STARTING_RADIUS = 150; // Reduced initial radius from center
const ANGLE_STEP = 15; // Slightly larger angle step for better distribution

/**
 * Check if two line segments intersect
 * Uses cross product method to determine intersection
 */
function lineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (a: Point, b: Point, c: Point) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  
  // Check if line segments intersect
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Check if two rectangles overlap with buffer
 * Returns true if they DO overlap (collision detected)
 */
function checkOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number,
  buffer: number
): boolean {
  // Add buffer to all sides for safety
  const overlap = !(
    x1 + w1 + buffer < x2 || 
    x2 + w2 + buffer < x1 || 
    y1 + h1 + buffer < y2 || 
    y2 + h2 + buffer < y1
  );
  
  return overlap;
}

/**
 * Count how many existing relationship lines would be crossed
 * if we place the entity at the given position
 */
function countLineCrossings(
  entityPos: Point,
  entityId: string,
  relationships: Relationship[],
  positions: Map<string, { x: number; y: number }>
): number {
  let crossings = 0;
  
  // Get center point of entity at test position
  const entityCenter = {
    x: entityPos.x + ENTITY_WIDTH / 2,
    y: entityPos.y + ENTITY_HEIGHT / 2
  };
  
  // Find all relationships connected to this entity
  const connectedRelationships = relationships.filter(
    rel => rel.fromEntityId === entityId || rel.toEntityId === entityId
  );
  
  if (connectedRelationships.length === 0) return 0;
  
  // For each relationship connected to this entity
  for (const rel of connectedRelationships) {
    // Calculate relationship diamond position (midpoint between entities)
    const otherEntityId = rel.fromEntityId === entityId ? rel.toEntityId : rel.fromEntityId;
    const otherEntityPos = positions.get(otherEntityId);
    
    if (!otherEntityPos) continue; // Other entity not placed yet
    
    const otherCenter = {
      x: otherEntityPos.x + ENTITY_WIDTH / 2,
      y: otherEntityPos.y + ENTITY_HEIGHT / 2
    };
    
    const relCenter = {
      x: (entityCenter.x + otherCenter.x) / 2,
      y: (entityCenter.y + otherCenter.y) / 2
    };
    
    // Check this line against all OTHER existing relationship lines
    for (const otherRel of relationships) {
      // Skip if this is the same relationship or if it involves this entity
      if (otherRel.id === rel.id) continue;
      if (otherRel.fromEntityId === entityId || otherRel.toEntityId === entityId) continue;
      
      // Get positions of both entities in the other relationship
      const fromPos = positions.get(otherRel.fromEntityId);
      const toPos = positions.get(otherRel.toEntityId);
      
      if (!fromPos || !toPos) continue; // Not both placed yet
      
      const fromCenter = {
        x: fromPos.x + ENTITY_WIDTH / 2,
        y: fromPos.y + ENTITY_HEIGHT / 2
      };
      
      const toCenter = {
        x: toPos.x + ENTITY_WIDTH / 2,
        y: toPos.y + ENTITY_HEIGHT / 2
      };
      
      const otherRelCenter = {
        x: (fromCenter.x + toCenter.x) / 2,
        y: (fromCenter.y + toCenter.y) / 2
      };
      
      // Check if our line (entity -> relationship) intersects other line segments
      // Line 1: entity to relationship diamond
      // Check against: otherEntity to otherRelationship
      if (lineSegmentsIntersect(entityCenter, relCenter, fromCenter, otherRelCenter)) {
        crossings++;
      }
      
      // Check against: otherRelationship to otherEntity
      if (lineSegmentsIntersect(entityCenter, relCenter, otherRelCenter, toCenter)) {
        crossings++;
      }
      
      // Also check: relationship to otherEntity
      if (lineSegmentsIntersect(relCenter, otherCenter, fromCenter, otherRelCenter)) {
        crossings++;
      }
      
      if (lineSegmentsIntersect(relCenter, otherCenter, otherRelCenter, toCenter)) {
        crossings++;
      }
    }
  }
  
  return crossings;
}

/**
 * Find optimal position with minimal line crossings using spiral search pattern
 */
function findNonOverlappingPosition(
  placedEntities: PlacedEntity[],
  centerX: number,
  centerY: number,
  entityId: string,
  entityName: string = 'Unknown',
  relationships: Relationship[],
  positions: Map<string, { x: number; y: number }>,
  maxAttempts: number = 2000,
  maxCandidates: number = 30
): { x: number; y: number } {
  
  // If no entities placed yet, place at center
  if (placedEntities.length === 0) {
    const pos = { x: centerX - ENTITY_WIDTH / 2, y: centerY - ENTITY_HEIGHT / 2 };
    console.log(`📍 First entity "${entityName}" at center (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
    return pos;
  }

  // Simple spiral pattern from center outward
  let attempts = 0;
  let radius = STARTING_RADIUS;
  let angle = 0;
  
  // Calculate collision box dimensions
  const collisionWidth = ENTITY_WIDTH + COLLISION_PADDING;
  const collisionHeight = ENTITY_HEIGHT + COLLISION_PADDING;
  
  interface Candidate {
    pos: { x: number; y: number };
    crossings: number;
    distance: number; // Distance from target center
  }
  
  const candidates: Candidate[] = [];
  
  // Collect multiple candidates to find the best position with minimal crossings
  // For minimal space, start with smaller radius and more aggressive search
  let searchRadius = radius;
  let searchAngle = angle;
  
  while (attempts < maxAttempts && candidates.length < maxCandidates) {
    const angleRad = (searchAngle * Math.PI) / 180;
    const x = centerX + Math.cos(angleRad) * searchRadius - ENTITY_WIDTH / 2;
    const y = centerY + Math.sin(angleRad) * searchRadius - ENTITY_HEIGHT / 2;
    
    // Check if this position overlaps with any placed entity
    let hasOverlap = false;
    for (const placed of placedEntities) {
      if (checkOverlap(x, y, collisionWidth, collisionHeight,
                       placed.x, placed.y, placed.width, placed.height, MIN_SPACING)) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      // Valid position found - count line crossings
      const crossings = countLineCrossings({ x, y }, entityId, relationships, positions);
      
      // Calculate distance from target
      const dx = (x + ENTITY_WIDTH / 2) - centerX;
      const dy = (y + ENTITY_HEIGHT / 2) - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      candidates.push({ pos: { x, y }, crossings, distance });
    }
    
    // Move to next position in spiral - for minimal space, use tighter spiral
    searchAngle += ANGLE_STEP;
    if (searchAngle >= 360) {
      searchAngle = 0;
      searchRadius += RADIUS_STEP;
    }
    
    attempts++;
  }
  
  // If we found candidates, choose the best one
  if (candidates.length > 0) {
    // Sort by: 1) closest to target (prioritize minimal space), 2) fewest crossings
    candidates.sort((a, b) => {
      // Primary: minimize distance to use minimal space
      if (Math.abs(a.distance - b.distance) > 5) return a.distance - b.distance;
      // Secondary: minimize crossings if distances are similar
      return a.crossings - b.crossings;
    });
    
    const best = candidates[0];
    console.log(`📍 "${entityName}" placed at (${Math.round(best.pos.x)}, ${Math.round(best.pos.y)}) with ${best.crossings} line crossings (tested ${candidates.length} candidates)`);
    return best.pos;
  }
  
  // Fallback: place far away if no position found (should never happen)
  console.warn(`⚠️ Could not find non-overlapping position for "${entityName}" after ${maxAttempts} attempts, using fallback`);
  const fallbackX = centerX + radius + MIN_SPACING * 2;
  const fallbackY = centerY + (placedEntities.length * (collisionHeight + MIN_SPACING));
  return { x: fallbackX, y: fallbackY };
}

/**
 * Sequential Compact Layout Algorithm
 * Places entities one by one without overlaps
 */
export function calculateSequentialLayout(
  entities: Entity[],
  relationships: Relationship[],
  viewportCenter: { x: number; y: number }
): Map<string, { x: number; y: number }> {
  
  const positions = new Map<string, { x: number; y: number }>();
  const placedEntities: PlacedEntity[] = [];
  
  if (entities.length === 0) return positions;

  console.log(`📦 Starting sequential layout for ${entities.length} entities, ${relationships.length} relationships`);
  console.log(`⚙️ Spacing: ${MIN_SPACING}px, Radius step: ${RADIUS_STEP}px, Starting radius: ${STARTING_RADIUS}px`);
  
  // Build connection graph to prioritize connected entities
  const connections = new Map<string, Set<string>>();
  entities.forEach(entity => {
    connections.set(entity.id, new Set());
  });

  relationships.forEach(rel => {
    connections.get(rel.fromEntityId)?.add(rel.toEntityId);
    connections.get(rel.toEntityId)?.add(rel.fromEntityId);
  });

  // Sort entities by connection count (most connected first)
  const sortedEntities = [...entities].sort((a, b) => {
    const aConnections = connections.get(a.id)?.size || 0;
    const bConnections = connections.get(b.id)?.size || 0;
    return bConnections - aConnections;
  });

  // Place entities one by one
  sortedEntities.forEach((entity, index) => {
    // For connected entities, try to place near their connections
    let targetX = viewportCenter.x;
    let targetY = viewportCenter.y;
    
    if (index > 0) {
      const connectedTo = connections.get(entity.id);
      if (connectedTo && connectedTo.size > 0) {
        // Calculate average position of connected entities
        let sumX = 0, sumY = 0, count = 0;
        connectedTo.forEach(connectedId => {
          const connectedPos = positions.get(connectedId);
          if (connectedPos) {
            sumX += connectedPos.x + ENTITY_WIDTH / 2;
            sumY += connectedPos.y + ENTITY_HEIGHT / 2;
            count++;
          }
        });
        
        if (count > 0) {
          targetX = sumX / count;
          targetY = sumY / count;
          // For connected entities, prefer positions closer to connections (minimal space)
          console.log(`🔗 "${entity.name}" targeting near connected entities at (${Math.round(targetX)}, ${Math.round(targetY)})`);
        }
      }
    }
    
    // Find optimal position with minimal line crossings
    const pos = findNonOverlappingPosition(
      placedEntities, 
      targetX, 
      targetY, 
      entity.id,
      entity.name,
      relationships,
      positions
    );
    
    positions.set(entity.id, pos);
    
    // Store with collision box for future collision checks
    const collisionWidth = ENTITY_WIDTH + COLLISION_PADDING;
    const collisionHeight = ENTITY_HEIGHT + COLLISION_PADDING;
    
    // CRITICAL: Verify no overlap with already placed entities before adding
    let hasAnyOverlap = false;
    for (const placed of placedEntities) {
      if (checkOverlap(pos.x, pos.y, collisionWidth, collisionHeight,
                       placed.x, placed.y, placed.width, placed.height, MIN_SPACING)) {
        console.error(`❌ OVERLAP DETECTED for "${entity.name}" at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
        hasAnyOverlap = true;
        break;
      }
    }
    
    if (!hasAnyOverlap) {
      placedEntities.push({
        id: entity.id,
        x: pos.x,
        y: pos.y,
        width: collisionWidth,
        height: collisionHeight
      });
    } else {
      console.warn(`⚠️ Skipping overlap for "${entity.name}" - this should never happen`);
    }
  });

  console.log(`✅ Sequential layout complete - ${positions.size} entities placed with no overlaps`);
  console.log(`📍 Diagram centered at viewport: (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})`);
  
  return positions;
}

/**
 * Get viewport center - ensures diagram appears in middle of screen
 * Calculates based on current window dimensions
 */
export function getViewportCenter(): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    console.log(`🎯 Viewport center calculated: (${Math.round(centerX)}, ${Math.round(centerY)}) from window size ${window.innerWidth}x${window.innerHeight}`);
    return { x: centerX, y: centerY };
  }
  return { x: 960, y: 540 }; // Fallback for SSR (1920x1080 / 2)
}
