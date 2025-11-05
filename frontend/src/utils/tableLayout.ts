/**
 * Table Layout Utilities
 * Handles layout calculations for table nodes in table view mode
 */

import type { TableNode } from './modeConversion';

/**
 * Calculate table dimensions based on its content
 * @param node - The table node to calculate dimensions for
 * @returns Object with width and height in pixels
 */
export function getTableSize(node: TableNode): { width: number; height: number } {
  const columns = node.data.columns.length;
  const rows = node.data.values?.[0]?.length || 0;
  
  // Calculate width: minimum 320px, plus 150px per column
  const width = Math.max(320, columns * 150);
  
  // Calculate height: sum of all sections
  const headerHeight = 70;
  const pkSectionHeight = 50;
  const rowHeight = 40;
  const buttonsHeight = 50;
  const height = headerHeight + pkSectionHeight + (rows + 1) * rowHeight + buttonsHeight;
  
  return { 
    width, 
    height: Math.max(300, height) 
  };
}

/**
 * Vertical Stack Layout Configuration
 */
const STACK_CONFIG = {
  HEADER_HEIGHT: 80,           // Height of visible table header
  HORIZONTAL_OFFSET: 30,       // Diagonal offset per table (cascade effect)
  START_Y_OFFSET: -200,        // Vertical offset from viewport center
  START_X_OFFSET: -400,        // Horizontal offset from viewport center
} as const;

/**
 * Calculate vertical stack layout for table nodes
 * Tables are stacked with partial overlap - each table's header remains visible
 * Similar to cascading windows where headers are accessible for dragging
 * 
 * @param nodes - Array of table nodes to layout
 * @param viewportCenter - Center point of the viewport
 * @returns Map of table node IDs to their calculated positions
 */
export function calculateTableStackLayout(
  nodes: TableNode[],
  viewportCenter: { x: number; y: number }
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (nodes.length === 0) return positions;

  console.log(`📦 Starting vertical stack layout for ${nodes.length} tables`);
  
  // Calculate starting position
  const startX = viewportCenter.x + STACK_CONFIG.START_X_OFFSET;
  const startY = viewportCenter.y + STACK_CONFIG.START_Y_OFFSET;
  
  // Calculate positions for each table in a stack
  nodes.forEach((node, index) => {
    // Stack vertically with diagonal offset for cascading effect
    // Each table overlaps the previous one, showing only the header
    const x = startX + (index * STACK_CONFIG.HORIZONTAL_OFFSET);
    const y = startY + (index * STACK_CONFIG.HEADER_HEIGHT);
    
    positions.set(node.id, { x, y });
    console.log(`📍 "${node.data.tableName}" stacked at (${Math.round(x)}, ${Math.round(y)})`);
  });

  console.log(`✅ Vertical stack layout complete - ${positions.size} tables stacked`);
  
  return positions;
}

/**
 * Get viewport center coordinates for table layout
 * @returns Object with x and y coordinates of viewport center
 */
export function getTableViewportCenter(): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }
  return { x: 500, y: 400 }; // Fallback for SSR
}

/**
 * Calculate table dimensions based on columns and rows
 * Utility function for estimating table size
 * 
 * @param columns - Number of columns
 * @param rows - Number of data rows
 * @param minWidth - Minimum table width (default 280)
 * @param maxWidth - Maximum table width (default 600)
 * @returns Object with width and height
 */
export function estimateTableDimensions(
  columns: number,
  rows: number,
  minWidth: number = 280,
  maxWidth: number = 600
): { width: number; height: number } {
  const baseWidth = Math.max(minWidth, Math.min(maxWidth, columns * 100));
  const headerHeight = 80;
  const rowHeight = 40;
  const footerHeight = 50;
  
  return {
    width: baseWidth,
    height: headerHeight + rows * rowHeight + footerHeight
  };
}

