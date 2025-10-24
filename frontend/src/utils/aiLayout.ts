import { generateLayoutPositions } from '../services/api';
import type { BackendTable, BackendRelationship } from './schemaTransform';

export interface LayoutPosition {
  x: number;
  y: number;
}

/**
 * Force-directed layout algorithm (fallback when AI fails)
 * Simulates physical forces between nodes to create a balanced layout
 */
function forceDirectedLayout(
  tables: BackendTable[],
  relationships: BackendRelationship[],
  iterations: number = 100
): Record<string, LayoutPosition> {
  const positions: Record<string, LayoutPosition> = {};
  const velocities: Record<string, { vx: number; vy: number }> = {};
  
  // Get viewport center
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
  
  // Initialize random positions around center
  tables.forEach((table, index) => {
    const angle = (index * (360 / tables.length)) * (Math.PI / 180);
    const radius = 200;
    positions[table.name] = {
      x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
      y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
    };
    velocities[table.name] = { vx: 0, vy: 0 };
  });
  
  // Physics constants
  const repulsionStrength = 50000; // Nodes repel each other
  const attractionStrength = 0.01; // Connected nodes attract
  const centerAttractionStrength = 0.001; // Pull towards center
  const damping = 0.85; // Velocity damping
  const minDistance = 300; // Minimum distance between nodes
  
  // Create adjacency map for relationships
  const connections = new Map<string, Set<string>>();
  relationships.forEach((rel) => {
    if (!connections.has(rel.fromTable)) {
      connections.set(rel.fromTable, new Set());
    }
    if (!connections.has(rel.toTable)) {
      connections.set(rel.toTable, new Set());
    }
    connections.get(rel.fromTable)!.add(rel.toTable);
    connections.get(rel.toTable)!.add(rel.fromTable);
  });
  
  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate forces
    tables.forEach((table1) => {
      const pos1 = positions[table1.name];
      let fx = 0;
      let fy = 0;
      
      // Repulsion from all other nodes
      tables.forEach((table2) => {
        if (table1.name === table2.name) return;
        
        const pos2 = positions[table2.name];
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        
        if (dist < minDistance) {
          // Strong repulsion when too close
          const force = repulsionStrength / Math.max(distSq, 100);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        } else {
          // Normal repulsion
          const force = repulsionStrength / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      });
      
      // Attraction for connected nodes
      const connectedNodes = connections.get(table1.name) || new Set();
      connectedNodes.forEach((connectedName) => {
        const pos2 = positions[connectedName];
        if (!pos2) return;
        
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const force = dist * attractionStrength;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      });
      
      // Attraction towards center (prevent drift)
      const dx = centerX - pos1.x;
      const dy = centerY - pos1.y;
      fx += dx * centerAttractionStrength;
      fy += dy * centerAttractionStrength;
      
      // Update velocity and position
      const vel = velocities[table1.name];
      vel.vx = (vel.vx + fx) * damping;
      vel.vy = (vel.vy + fy) * damping;
      
      pos1.x += vel.vx;
      pos1.y += vel.vy;
    });
  }
  
  return positions;
}

/**
 * Generate smart layout using AI, with force-directed fallback
 */
export async function generateSmartLayout(
  tables: BackendTable[],
  relationships: BackendRelationship[]
): Promise<Record<string, LayoutPosition>> {
  // Convert tables to simple entity format for AI
  const entities = tables.map(table => ({
    name: table.name,
    attributes: table.attributes,
  }));
  
  // Convert relationships to simple format for AI
  const rels = relationships.map(rel => ({
    fromTable: rel.fromTable,
    toTable: rel.toTable,
    relationshipName: rel.relationshipName || 'relates',
  }));
  
  try {
    console.log('🤖 Attempting AI-powered layout generation...');
    const response = await generateLayoutPositions(entities, rels);
    
    if (response.success && Object.keys(response.positions).length > 0) {
      console.log('✅ AI layout generated successfully');
      return response.positions;
    } else {
      throw new Error('AI returned empty positions');
    }
  } catch (error) {
    console.warn('⚠️ AI layout failed, using force-directed fallback:', error);
    const fallbackPositions = forceDirectedLayout(tables, relationships);
    console.log('✅ Force-directed layout generated');
    return fallbackPositions;
  }
}

