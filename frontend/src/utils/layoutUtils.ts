export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionElement {
  id: string;
  type: 'entity' | 'relationship' | 'attribute';
  position: Position;
  bounds: Bounds;
}

// Calculate distance between two points
export function distance(p1: Position, p2: Position): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Get bounds for different element types
// Note: Padding removed since collision detection is disabled for free movement
export function getBounds(element: any, position: Position): Bounds {
  const ENTITY_PADDING = 0; // No padding - allow free overlap
  const RELATIONSHIP_PADDING = 0; // No padding - allow free overlap
  const ATTRIBUTE_PADDING = 0; // No padding - allow free overlap
  
  switch (element.type || 'entity') {
    case 'entity':
      return {
        x: position.x - ENTITY_PADDING / 2,
        y: position.y - ENTITY_PADDING / 2,
        width: 180 + ENTITY_PADDING,
        height: 70 + ENTITY_PADDING,
      };
    case 'relationship':
      return {
        x: position.x - RELATIONSHIP_PADDING / 2,
        y: position.y - RELATIONSHIP_PADDING / 2,
        width: 130 + RELATIONSHIP_PADDING,
        height: 130 + RELATIONSHIP_PADDING,
      };
    case 'attribute':
      return {
        x: position.x - 30 - ATTRIBUTE_PADDING / 2,
        y: position.y - 15 - ATTRIBUTE_PADDING / 2,
        width: 60 + ATTRIBUTE_PADDING,
        height: 30 + ATTRIBUTE_PADDING,
      };
    default:
      return {
        x: position.x,
        y: position.y,
        width: 50,
        height: 50,
      };
  }
}

// Check if two rectangular bounds overlap
export function checkBoundsCollision(bounds1: Bounds, bounds2: Bounds): boolean {
  return !(
    bounds1.x + bounds1.width < bounds2.x ||
    bounds2.x + bounds2.width < bounds1.x ||
    bounds1.y + bounds1.height < bounds2.y ||
    bounds2.y + bounds2.height < bounds1.y
  );
}

// Check if a position collides with any element
export function checkCollision(
  newBounds: Bounds,
  otherElements: CollisionElement[],
  excludeId?: string
): boolean {
  for (const element of otherElements) {
    if (element.id === excludeId) continue;
    
    if (checkBoundsCollision(newBounds, element.bounds)) {
      return true;
    }
  }
  return false;
}

// Validate if a position is valid (no collisions)
export function isPositionValid(
  elementId: string,
  elementType: 'entity' | 'relationship' | 'attribute',
  newPosition: Position,
  allElements: CollisionElement[]
): boolean {
  const newBounds = getBounds({ type: elementType }, newPosition);
  return !checkCollision(newBounds, allElements, elementId);
}

// Create collision elements from entities, relationships, and attributes
export function createCollisionElements(
  entities: any[],
  relationships: any[],
  attributePositions?: Map<string, Position>
): CollisionElement[] {
  const elements: CollisionElement[] = [];
  
  // Add entities
  entities.forEach(entity => {
    elements.push({
      id: entity.id,
      type: 'entity',
      position: { x: entity.x, y: entity.y },
      bounds: getBounds({ type: 'entity' }, { x: entity.x, y: entity.y }),
    });
  });
  
  // Add relationships
  relationships.forEach(rel => {
    elements.push({
      id: rel.id,
      type: 'relationship',
      position: { x: rel.x, y: rel.y },
      bounds: getBounds({ type: 'relationship' }, { x: rel.x, y: rel.y }),
    });
  });
  
  // Add attributes if positions provided
  if (attributePositions) {
    attributePositions.forEach((position, attrId) => {
      elements.push({
        id: attrId,
        type: 'attribute',
        position,
        bounds: getBounds({ type: 'attribute' }, position),
      });
    });
  }
  
  return elements;
}

// Reposition relationships to midpoints between their connected entities
export function repositionRelationshipsToMidpoints(
  relationships: any[],
  entities: any[]
): any[] {
  return relationships.map(rel => {
    const fromEntity = entities.find(e => e.id === rel.fromEntityId);
    const toEntity = entities.find(e => e.id === rel.toEntityId);
    
    if (fromEntity && toEntity) {
      return {
        ...rel,
        x: (fromEntity.x + toEntity.x) / 2,
        y: (fromEntity.y + toEntity.y) / 2,
      };
    }
    return rel;
  });
}

// Simple overlap prevention: find a nearby position that doesn't overlap
export function findNonOverlappingPosition(
  desiredPos: Position,
  avoidPositions: Position[],
  minDistance: number = 80
): Position {
  // If no overlap, return original position
  let hasOverlap = false;
  for (const avoidPos of avoidPositions) {
    if (distance(desiredPos, avoidPos) < minDistance) {
      hasOverlap = true;
      break;
    }
  }
  
  if (!hasOverlap) {
    return desiredPos;
  }
  
  // Try positions in a spiral pattern to find a non-overlapping spot
  const maxAttempts = 20;
  const angleStep = Math.PI / 6; // 30 degrees
  const radiusStep = minDistance;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const radius = attempt * radiusStep;
    const angles = Array.from({ length: attempt * 6 }, (_, i) => i * angleStep);
    
    for (const angle of angles) {
      const testPos = {
        x: desiredPos.x + Math.cos(angle) * radius,
        y: desiredPos.y + Math.sin(angle) * radius,
      };
      
      let overlaps = false;
      for (const avoidPos of avoidPositions) {
        if (distance(testPos, avoidPos) < minDistance) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return testPos;
      }
    }
  }
  
  // If we can't find a good position, return the original
  return desiredPos;
}
