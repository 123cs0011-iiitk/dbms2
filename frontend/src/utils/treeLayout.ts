import type { Entity, Relationship } from '../App';
import { calculateSequentialLayout, getViewportCenter } from './sequentialLayout';

/**
 * Calculate sequential compact layout for entities (replaces tree layout)
 * Returns a map of entity IDs to new positions
 * 
 * This function now uses sequential placement instead of tree structure
 * to create compact layouts with no overlaps
 */
export function calculateTreeLayout(
  entities: Entity[],
  relationships: Relationship[],
  viewportCenter: { x: number; y: number }
): Map<string, { x: number; y: number }> {
  console.log(`📦 Using sequential compact layout for ${entities.length} entities`);
  
  // Use sequential layout algorithm - no overlaps guaranteed
  return calculateSequentialLayout(entities, relationships, viewportCenter);
}

// Re-export for convenience
export { getViewportCenter };
