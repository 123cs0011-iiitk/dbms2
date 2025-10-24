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
  baseRadius: 150,
  minRadius: 120,
  maxRadius: 250,
  subAttributeRadius: 80,
  radiusIncrement: 8,
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
 */
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

  subAttrs.forEach((subAttr, index) => {
    const angle = calculateAngle(index, subAttrs.length);
    const desiredX = parentX + Math.cos(angle) * radius;
    const desiredY = parentY + Math.sin(angle) * radius;

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

/**
 * Layout all attributes for a single entity
 */
export function layoutEntityAttributes(
  entity: Entity,
  config: AttributeLayoutConfig = DEFAULT_CONFIG,
  existingPositions: AttributePosition[] = []
): Map<string, AttributePosition> {
  const positions = new Map<string, AttributePosition>();
  
  if (!entity.attributes || entity.attributes.length === 0) {
    return positions;
  }

  const entityCenterX = entity.x + 90; // Entity center X (half of 180px width)
  const entityCenterY = entity.y + 35; // Entity center Y (half of 70px height)
  
  const attributes = entity.attributes;
  const radius = calculateRadius(attributes.length, config);

  // Layout main attributes around entity
  attributes.forEach((attr, index) => {
    // Skip if attribute already has custom position
    if (attr.customX !== undefined && attr.customY !== undefined) {
      const customPos = { x: attr.customX, y: attr.customY };
      positions.set(attr.id, customPos);
      existingPositions.push(customPos);
      return;
    }

    const angle = calculateAngle(index, attributes.length);
    const desiredX = entityCenterX + Math.cos(angle) * radius;
    const desiredY = entityCenterY + Math.sin(angle) * radius;

    const position = findNonOverlappingPosition(
      { x: desiredX, y: desiredY },
      existingPositions
    );

    positions.set(attr.id, position);
    existingPositions.push(position);

    // If this is a composite attribute, layout its sub-attributes
    if (attr.isComposite && attr.subAttributes && attr.subAttributes.length > 0) {
      const subPositions = layoutSubAttributes(
        attr,
        position.x,
        position.y,
        config,
        existingPositions
      );
      
      // Merge sub-attribute positions into main positions map
      subPositions.forEach((pos, id) => {
        positions.set(id, pos);
      });
    }
  });

  return positions;
}

/**
 * Layout all attributes for all entities in the diagram
 */
export function layoutAllAttributes(
  entities: Entity[],
  config: AttributeLayoutConfig = DEFAULT_CONFIG
): Map<string, AttributePosition> {
  const allPositions = new Map<string, AttributePosition>();
  const existingPositions: AttributePosition[] = [];

  // First pass: collect all entity positions to avoid
  entities.forEach((entity) => {
    existingPositions.push({
      x: entity.x + 90,
      y: entity.y + 35,
    });
  });

  // Second pass: layout attributes for each entity
  entities.forEach((entity) => {
    const entityAttrPositions = layoutEntityAttributes(entity, config, existingPositions);
    
    // Merge into global positions map
    entityAttrPositions.forEach((pos, id) => {
      allPositions.set(id, pos);
    });
  });

  return allPositions;
}

/**
 * Apply attribute positions to entities (mutates entities)
 */
export function applyAttributePositions(
  entities: Entity[],
  positions: Map<string, AttributePosition>
): void {
  entities.forEach((entity) => {
    entity.attributes?.forEach((attr) => {
      const pos = positions.get(attr.id);
      if (pos) {
        attr.customX = pos.x;
        attr.customY = pos.y;
      }

      // Apply positions to sub-attributes
      if (attr.isComposite && attr.subAttributes) {
        attr.subAttributes.forEach((subAttr) => {
          const subPos = positions.get(subAttr.id);
          if (subPos) {
            subAttr.customX = subPos.x;
            subAttr.customY = subPos.y;
          }
        });
      }
    });
  });
}

