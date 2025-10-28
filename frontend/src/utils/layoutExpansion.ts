import type { Entity, Relationship } from '../App';

export interface PositionStore {
  entities: Map<string, { x: number; y: number }>;
  relationships: Map<string, { x: number; y: number }>;
}

/**
 * Calculate viewport center for expansion origin
 */
function getViewportCenter(): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }
  return { x: 500, y: 400 }; // Fallback
}

/**
 * Calculate dynamic expansion factor based on attribute count
 * Formula: 1.0 + (avgAttributesPerEntity * 0.15) + 0.3, capped at 3.0x
 * More aggressive expansion to prevent overlapping
 */
export function calculateExpansionFactor(entities: Entity[]): number {
  if (entities.length === 0) return 1.0;
  
  // Count total attributes across all entities
  let totalAttributes = 0;
  let entitiesWithAttributes = 0;
  
  entities.forEach(entity => {
    if (entity.attributes && entity.attributes.length > 0) {
      totalAttributes += entity.attributes.length;
      entitiesWithAttributes++;
    }
  });
  
  // If no entities have attributes, minimal expansion
  if (entitiesWithAttributes === 0) return 1.3;
  
  // Calculate average attributes per entity (only counting entities with attributes)
  const avgAttributes = totalAttributes / entitiesWithAttributes;
  
  // More aggressive expansion: base 1.3 + 0.15 per average attribute
  // This provides more space for attributes to spread out
  const factor = 1.3 + (avgAttributes * 0.15);
  
  // Cap at 3.0x maximum expansion
  return Math.min(factor, 3.0);
}

/**
 * Store original positions before expansion
 */
export function storeOriginalPositions(
  entities: Entity[],
  relationships: Relationship[]
): PositionStore {
  const entityPositions = new Map<string, { x: number; y: number }>();
  const relationshipPositions = new Map<string, { x: number; y: number }>();
  
  entities.forEach(entity => {
    entityPositions.set(entity.id, { x: entity.x, y: entity.y });
  });
  
  relationships.forEach(rel => {
    relationshipPositions.set(rel.id, { x: rel.x, y: rel.y });
  });
  
  return {
    entities: entityPositions,
    relationships: relationshipPositions,
  };
}

/**
 * Expand layout by scaling all positions outward from viewport center
 */
export function expandLayout(
  entities: Entity[],
  relationships: Relationship[],
  factor: number
): { entities: Entity[]; relationships: Relationship[] } {
  if (factor === 1.0) {
    console.log('⚠️ No expansion needed (factor = 1.0)');
    return { entities, relationships }; // No expansion needed
  }
  
  const center = getViewportCenter();
  console.log(`📐 Expansion center: (${Math.round(center.x)}, ${Math.round(center.y)})`);
  console.log(`📊 Expanding ${entities.length} entities and ${relationships.length} relationships by ${factor.toFixed(2)}x`);
  
  // Expand entities
  const expandedEntities = entities.map((entity, index) => {
    // Calculate vector from center to entity
    const dx = entity.x - center.x;
    const dy = entity.y - center.y;
    
    // Scale the vector
    const newX = center.x + dx * factor;
    const newY = center.y + dy * factor;
    
    if (index === 0) {
      console.log(`  Entity "${entity.name}": (${Math.round(entity.x)}, ${Math.round(entity.y)}) → (${Math.round(newX)}, ${Math.round(newY)})`);
    }
    
    return {
      ...entity,
      x: newX,
      y: newY,
    };
  });
  
  // Expand relationships
  const expandedRelationships = relationships.map(rel => {
    // Calculate vector from center to relationship
    const dx = rel.x - center.x;
    const dy = rel.y - center.y;
    
    // Scale the vector
    const newX = center.x + dx * factor;
    const newY = center.y + dy * factor;
    
    return {
      ...rel,
      x: newX,
      y: newY,
    };
  });
  
  return {
    entities: expandedEntities,
    relationships: expandedRelationships,
  };
}

/**
 * Restore original positions from stored data
 */
export function restoreOriginalPositions(
  entities: Entity[],
  relationships: Relationship[],
  stored: PositionStore
): { entities: Entity[]; relationships: Relationship[] } {
  // Restore entity positions
  const restoredEntities = entities.map(entity => {
    const originalPos = stored.entities.get(entity.id);
    if (originalPos) {
      return {
        ...entity,
        x: originalPos.x,
        y: originalPos.y,
      };
    }
    return entity;
  });
  
  // Restore relationship positions
  const restoredRelationships = relationships.map(rel => {
    const originalPos = stored.relationships.get(rel.id);
    if (originalPos) {
      return {
        ...rel,
        x: originalPos.x,
        y: originalPos.y,
      };
    }
    return rel;
  });
  
  return {
    entities: restoredEntities,
    relationships: restoredRelationships,
  };
}

/**
 * Clear custom attribute positions (used when hiding attributes)
 * Also resets base x,y to default below-entity position
 */
export function clearAttributeCustomPositions(entities: Entity[]): Entity[] {
  return entities.map(entity => ({
    ...entity,
    attributes: entity.attributes?.map(attr => ({
      ...attr,
      // Reset to default position below entity
      x: entity.x + 90 - 70,
      y: entity.y + 35 + 200 - 18,
      customX: undefined,
      customY: undefined,
    })) || [],
  }));
}

