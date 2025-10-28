import { TableNode } from './modeConversion';

/**
 * Detects if two tables overlap
 */
function checkOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  padding: number = 50
): boolean {
  // Check if the two rectangles overlap with padding
  return (
    x1 - padding < x2 + w2 + padding &&
    x1 + w1 + padding > x2 - padding &&
    y1 - padding < y2 + h2 + padding &&
    y1 + h1 + padding > y2 - padding
  );
}

/**
 * Resolves overlaps by repositioning tables that overlap with already positioned tables
 * @param nodes - Array of table nodes
 * @param tableWidth - Width of each table (default 500)
 * @param tableHeight - Height of each table (default 300)
 * @param minPadding - Minimum padding between tables (default 50)
 * @returns Array of nodes with adjusted positions to prevent overlaps
 */
export function detectAndResolveOverlaps(
  nodes: TableNode[],
  tableWidth: number = 500,
  tableHeight: number = 300,
  minPadding: number = 50
): TableNode[] {
  if (nodes.length === 0) return nodes;

  const resolvedNodes: TableNode[] = [];
  const SPACING_INCREMENT = 600; // Horizontal spacing between tables
  const VERTICAL_INCREMENT = 400; // Vertical spacing when moving to next row

  for (let i = 0; i < nodes.length; i++) {
    const currentNode = nodes[i];
    let currentPos = { x: currentNode.position.x, y: currentNode.position.y };
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    // Check for overlaps with already positioned tables
    while (attempts < maxAttempts) {
      let hasOverlap = false;

      for (const resolvedNode of resolvedNodes) {
        if (
          checkOverlap(
            currentPos.x,
            currentPos.y,
            tableWidth,
            tableHeight,
            resolvedNode.position.x,
            resolvedNode.position.y,
            tableWidth,
            tableHeight,
            minPadding
          )
        ) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        break; // Found a valid position
      }

      // Try to reposition: first move right, then move down if needed
      const moveDown = Math.floor(attempts / 3); // Move down every 3 horizontal attempts
      const horizontalOffset = (attempts % 3) * SPACING_INCREMENT;
      
      currentPos = {
        x: currentNode.position.x + horizontalOffset,
        y: currentNode.position.y + moveDown * VERTICAL_INCREMENT,
      };

      attempts++;
    }

    // Add the node with potentially adjusted position
    resolvedNodes.push({
      ...currentNode,
      position: currentPos,
    });
  }

  return resolvedNodes;
}

/**
 * Determines the size of a table based on its content
 */
export function getTableDimensions(
  columns: number,
  rows: number,
  minWidth: number = 280,
  maxWidth: number = 600
): { width: number; height: number } {
  // Base dimensions for table structure
  const baseWidth = Math.max(minWidth, Math.min(maxWidth, columns * 100));
  const headerHeight = 80;
  const rowHeight = 40;
  const footerHeight = 50;
  
  const height = headerHeight + rows * rowHeight + footerHeight;
  
  return { width: baseWidth, height };
}

