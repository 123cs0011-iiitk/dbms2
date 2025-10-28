import type { Entity, Attribute } from '../App';

export interface AttributePosition {
  x: number;
  y: number;
}

export interface AttributeLayoutConfig {
  baseRadius: number;       // Base radius for attribute positioning
  minRadius: number;        // Minimum radius
  maxRadius: number;        // Maximum radius
  subAttributeRadius: number; // Radius for sub-attributes around composite attributes
  radiusIncrement: number;  // Increment per attribute count
}

const DEFAULT_CONFIG: AttributeLayoutConfig = {
  baseRadius: 200,
  minRadius: 160,
  maxRadius: 320,
  subAttributeRadius: 110,
  radiusIncrement: 12,
};

/**
 * Calculate optimal radius based on number of attributes
 */
function calculateRadius(attributeCount: number, config: AttributeLayoutConfig): number {
  const calculatedRadius = config.baseRadius + attributeCount * config.radiusIncrement;
  return Math.min(Math.max(calculatedRadius, config.minRadius), config.maxRadius);
}

/**
 * Calculate angle for attribute positioning
 * Distributes attributes evenly around the entity
 */
function calculateAngle(index: number, total: number): number {
  if (total === 1) {
    return Math.PI / 2; // Below entity (90 degrees)
  } else if (total === 2) {
    // Position at 60 and 120 degrees for better aesthetics
    return index === 0 ? Math.PI / 3 : (2 * Math.PI) / 3;
  } else if (total === 3) {
    // Position at 0, 120, 240 degrees
    return (index * 120) * (Math.PI / 180);
  } else if (total === 4) {
    // Position at 45, 135, 225, 315 degrees
    return (45 + index * 90) * (Math.PI / 180);
  } else {
    // Evenly distribute around the circle
    // Start from top (270 degrees) and go clockwise
    const startAngle = -Math.PI / 2; // Start from top
    return startAngle + (index * (2 * Math.PI) / total);
  }
}

/**
 * Check if a position overlaps with existing positions
 */
function checkOverlap(
  position: AttributePosition,
  existingPositions: AttributePosition[],
  minDistance: number = 60
): boolean {
  for (const existing of existingPositions) {
    const dx = position.x - existing.x;
    const dy = position.y - existing.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minDistance) {
      return true;
    }
  }
  return false;
}

/**
 * Adjust position to avoid overlaps using spiral search
 */
function findNonOverlappingPosition(
  desiredPosition: AttributePosition,
  existingPositions: AttributePosition[],
  minDistance: number = 60
): AttributePosition {
  if (!checkOverlap(desiredPosition, existingPositions, minDistance)) {
    return desiredPosition;
  }

  // Try positions in a spiral pattern
  const maxAttempts = 12;
  const angleStep = Math.PI / 6; // 30 degrees

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const radiusOffset = attempt * 15;
    
    for (let angleOffset = 0; angleOffset < Math.PI * 2; angleOffset += angleStep) {
      const testPos = {
        x: desiredPosition.x + Math.cos(angleOffset) * radiusOffset,
        y: desiredPosition.y + Math.sin(angleOffset) * radiusOffset,
      };

      if (!checkOverlap(testPos, existingPositions, minDistance)) {
        return testPos;
      }
    }
  }

  // If no position found, return original (rare case)
  return desiredPosition;
}

/**
 * Layout sub-attributes around their parent composite attribute
 * NOTE: Currently disabled - subAttributes feature not yet implemented
 */
/*
function layoutSubAttributes(
  parentAttribute: Attribute,
  parentX: number,
  parentY: number,
  config: AttributeLayoutConfig,
  existingPositions: AttributePosition[]
): Map<string, AttributePosition> {
  const positions = new Map<string, AttributePosition>();
  
  if (!parentAttribute.subAttributes || parentAttribute.subAttributes.length === 0) {
    return positions;
  }

  const subAttrs = parentAttribute.subAttributes;
  const radius = config.subAttributeRadius;

  subAttrs.forEach((subAttr: any, index: number) => {
    const angle = calculateAngle(index, subAttrs.length);
    // Calculate center position
    const centerX = parentX + Math.cos(angle) * radius;
    const centerY = parentY + Math.sin(angle) * radius;
    
    // Convert to top-left coordinates (attribute is 140x36)
    const desiredX = centerX - 70; // Subtract half width
    const desiredY = centerY - 18; // Subtract half height

    const position = findNonOverlappingPosition(
      { x: desiredX, y: desiredY },
      existingPositions,
      50 // Smaller min distance for sub-attributes
    );

    positions.set(subAttr.id, position);
    existingPositions.push(position);
  });

  return positions;
}
*/

/**
 * Layout all attributes for a single entity
 */
export function layoutEntityAttributes(
  entity: Entity,
  config: AttributeLayoutConfig = DEFAULT_CONFIG,
  existingPositions: AttributePosition[] = [],
  expansionFactor: number = 1.0
): Map<string, AttributePosition> {
  const positions = new Map<string, AttributePosition>();
  
  if (!entity.attributes || entity.attributes.length === 0) {
    return positions;
  }

  const entityCenterX = entity.x + 90; // Entity center X (half of 180px width)
  const entityCenterY = entity.y + 35; // Entity center Y (half of 70px height)
  
  const attributes = entity.attributes;
  const baseRadius = calculateRadius(attributes.length, config);
  const radius = baseRadius * expansionFactor; // Scale radius by expansion factor

  // Layout main attributes around entity
  attributes.forEach((attr, index) => {
    // Always recalculate positions based on current entity location
    // (Don't skip based on customX/customY - those should be updated)
    const angle = calculateAngle(index, attributes.length);
    // Calculate center position first
    const centerX = entityCenterX + Math.cos(angle) * radius;
    const centerY = entityCenterY + Math.sin(angle) * radius;
    
    // Convert to top-left coordinates (attribute is 140x36)
    const desiredX = centerX - 70; // Subtract half width
    const desiredY = centerY - 18; // Subtract half height

    const position = findNonOverlappingPosition(
      { x: desiredX, y: desiredY },
      existingPositions
    );

    positions.set(attr.id, position);
    existingPositions.push(position);

    // NOTE: Sub-attributes feature currently disabled
    // If this is a composite attribute, layout its sub-attributes
    // if (attr.isComposite && attr.subAttributes && attr.subAttributes.length > 0) {
    //   const parentCenterX = position.x + 70;
    //   const parentCenterY = position.y + 18;
    //   const subPositions = layoutSubAttributes(attr, parentCenterX, parentCenterY, config, existingPositions);
    //   subPositions.forEach((pos, id) => {
    //     positions.set(id, pos);
    //   });
    // }
  });

  return positions;
}

/**
 * Recalculate attributes for a single entity (used when entity is dragged)
 */
export function recalculateAttributesForEntity(
  entity: Entity,
  config: AttributeLayoutConfig = DEFAULT_CONFIG,
  expansionFactor: number = 1.0
): Map<string, AttributePosition> {
  // Use empty existingPositions since we're only recalculating for this entity
  return layoutEntityAttributes(entity, config, [], expansionFactor);
}

/**
 * Layout all attributes for all entities in the diagram
 */
export function layoutAllAttributes(
  entities: Entity[],
  config: AttributeLayoutConfig = DEFAULT_CONFIG,
  expansionFactor: number = 1.0
): Map<string, AttributePosition> {
  const allPositions = new Map<string, AttributePosition>();
  const existingPositions: AttributePosition[] = [];

  console.log(`🎯 layoutAllAttributes: Processing ${entities.length} entities with expansion factor ${expansionFactor.toFixed(2)}`);

  // First pass: collect all entity positions to avoid
  entities.forEach((entity) => {
    existingPositions.push({
      x: entity.x + 90,
      y: entity.y + 35,
    });
  });

  // Second pass: layout attributes for each entity
  entities.forEach((entity, entityIndex) => {
    const attrCount = entity.attributes?.length || 0;
    console.log(`  Entity ${entityIndex + 1} "${entity.name}": ${attrCount} attributes`);
    
    const entityAttrPositions = layoutEntityAttributes(entity, config, existingPositions, expansionFactor);
    
    // Merge into global positions map
    entityAttrPositions.forEach((pos, id) => {
      allPositions.set(id, pos);
      const attr = entity.attributes?.find(a => a.id === id);
      if (attr) {
        console.log(`    ✓ ${attr.name}: (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
      }
    });
  });

  console.log(`✅ Total positioned: ${allPositions.size} attributes`);
  return allPositions;
}

/**
 * Apply attribute positions to entities (mutates entities)
 */
export function applyAttributePositions(
  entities: Entity[],
  positions: Map<string, AttributePosition>
): void {
  console.log(`🔧 applyAttributePositions: Applying ${positions.size} positions to ${entities.length} entities`);
  
  let appliedCount = 0;
  let missingCount = 0;
  
  entities.forEach((entity) => {
    entity.attributes?.forEach((attr) => {
      const pos = positions.get(attr.id);
      if (pos) {
        // Set both base position AND custom position
        // This ensures fallback works correctly
        attr.x = pos.x;
        attr.y = pos.y;
        attr.customX = pos.x;
        attr.customY = pos.y;
        appliedCount++;
      } else {
        console.warn(`  ⚠️ No position found for attribute "${attr.name}" (id: ${attr.id})`);
        missingCount++;
      }

      // NOTE: Sub-attributes feature currently disabled
      // Apply positions to sub-attributes
      // if (attr.isComposite && attr.subAttributes) {
      //   attr.subAttributes.forEach((subAttr: any) => {
      //     const subPos = positions.get(subAttr.id);
      //     if (subPos) {
      //       subAttr.x = subPos.x;
      //       subAttr.y = subPos.y;
      //       subAttr.customX = subPos.x;
      //       subAttr.customY = subPos.y;
      //     }
      //   });
      // }
    });
  });
  
  console.log(`✅ Applied ${appliedCount} positions, ${missingCount} missing`);
}

