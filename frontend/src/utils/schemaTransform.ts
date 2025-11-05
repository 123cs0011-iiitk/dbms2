import type { Entity, Attribute, Relationship } from '../App';
import { layoutAllAttributes, applyAttributePositions } from './attributeLayout';
import { calculateSequentialLayout } from './sequentialLayout';

// Backend schema types (matching the Python backend)
export interface BackendTable {
  name: string;
  attributes: string[];
  columns: Array<{
    name: string;
    type: string;
  }>;
  sampleData?: Array<{
    id: string;
    values: Record<string, string>;
  }>;
}

export interface BackendRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipName?: string; // AI-generated semantic name like "studies", "manages", etc.
}

export interface BackendSchema {
  tables: BackendTable[];
  relationships: BackendRelationship[];
}

// Color palette for entities (matching App.tsx gradient colors)
const ENTITY_COLORS = [
  '#7aa2f7', // blue
  '#9ece6a', // green
  '#bb9af7', // purple
  '#f7768e', // pink
  '#7dcfff', // cyan
  '#e0af68', // amber
];

// Auto-layout configuration
const LAYOUT_CONFIG = {
  radius: 300,
  centerX: 500,
  centerY: 400,
};

// Calculate viewport center for better positioning
const getViewportCenter = () => {
  if (typeof window !== 'undefined') {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }
  return { x: 500, y: 400 }; // Fallback
};

/**
 * Generate a meaningful relationship name from entity names
 * If AI doesn't provide one, create a simple semantic name
 */
function generateRelationshipName(_fromTable: string, _toTable: string, relationshipName?: string): string {
  if (relationshipName) {
    return relationshipName;
  }
  
  // Generate a simple semantic name based on table names
  // Example: "Student" + "Course" -> "enrolls"
  // Simple fallback: use a generic verb
  // TODO: Could enhance this to generate semantic names based on table names
  return 'has';
}

/**
 * Transform backend schema to frontend entities and relationships
 * Uses sequential placement with collision avoidance for perfect layouts
 */
export async function backendToFrontend(schemaData: BackendSchema): Promise<{
  entities: Entity[];
  relationships: Relationship[];
}> {
  if (!schemaData || !schemaData.tables) {
    return { entities: [], relationships: [] };
  }

  console.log('🎨 Starting tree-based radial layout from center...');

  const entities: Entity[] = [];
  const relationships: Relationship[] = [];

  const viewportCenter = getViewportCenter();
  
  // STEP 1: Build relationship graph
  const graph = new Map<string, string[]>();
  schemaData.tables.forEach(table => {
    graph.set(table.name, []);
  });

  schemaData.relationships.forEach(rel => {
    graph.get(rel.fromTable)?.push(rel.toTable);
    graph.get(rel.toTable)?.push(rel.fromTable);
  });

  // Find root entity (most connected)
  let rootTable = schemaData.tables[0];
  let maxConnections = 0;
  schemaData.tables.forEach(table => {
    const connections = graph.get(table.name)?.length || 0;
    if (connections > maxConnections) {
      maxConnections = connections;
      rootTable = table;
    }
  });
  
  console.log(`🌳 Root entity: "${rootTable.name}" with ${maxConnections} connections`);
  console.log(`📦 Preparing ${schemaData.tables.length} entities for sequential compact layout...`);

  // STEP 2: Create temporary entities for sequential layout
  const tempEntities: Entity[] = schemaData.tables.map((table, index) => {
    const entityId = `entity-${Date.now()}-${index}`;
    
    const attributes: Attribute[] = table.attributes.map((attrName, attrIndex) => {
      const columnData = table.columns.find(col => col.name === attrName);
      const dataType = columnData?.type || 'TEXT';

      return {
        id: `${table.name}-attr-${attrIndex}-${Date.now()}`,
        name: attrName,
        type: dataType,
        isPrimaryKey: attrName.toLowerCase().endsWith('_id') && !attrName.toLowerCase().endsWith('name'),
        isForeignKey: false,
        isNullable: !attrName.toLowerCase().includes('name') && !attrName.toLowerCase().endsWith('_id'),
        isUnique: attrName.toLowerCase().includes('email'),
        x: 0, // Will be calculated after entity positioning
        y: 0, // Will be calculated after entity positioning
        entityId: entityId,
      };
    });

    // Restore sample data if it exists in the backend schema
    const sampleData: Entity['sampleData'] = table.sampleData 
      ? table.sampleData.map((row) => {
          // Map row values back to attribute IDs
          // Backend stores values by attribute name, so we need to map them to attribute IDs
          const rowValues: Record<string, string> = {};
          attributes.forEach((attr) => {
            const attrId = attr.id;
            const attrName = attr.name;
            // Try to get value by attribute name (as stored in backend) or by ID
            rowValues[attrId] = row.values[attrName] || row.values[attrId] || '';
          });
          return {
            id: row.id,
            values: rowValues,
          };
        })
      : undefined;

    return {
      id: entityId,
      name: table.name,
      x: 0, // Will be set by force-directed algorithm
      y: 0, // Will be set by force-directed algorithm
      color: ENTITY_COLORS[index % ENTITY_COLORS.length],
      attributes,
      sampleData, // Include sample data in entity
      animationIndex: index,
    };
  });

  // STEP 3: Create temporary relationships for sequential layout
  const tempRelationships: Relationship[] = [];
  schemaData.relationships.forEach((rel, index) => {
    const fromEntity = tempEntities.find(e => e.name === rel.fromTable);
    const toEntity = tempEntities.find(e => e.name === rel.toTable);
    
    if (fromEntity && toEntity) {
      tempRelationships.push({
        id: `rel-${Date.now()}-${index}`,
        name: rel.relationshipName || `${rel.fromTable}_${rel.toTable}`,
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        cardinality: '1:N',
        fromCardinality: '1',
        toCardinality: 'N',
        x: 0, // Will be calculated after entity positions
        y: 0,
        animationIndex: index,
      });
    }
  });

  // STEP 4: Apply sequential layout algorithm for compact placement with no overlaps
  const positions = calculateSequentialLayout(tempEntities, tempRelationships, viewportCenter);

  // STEP 5: Apply calculated positions to entities
  tempEntities.forEach(entity => {
    const pos = positions.get(entity.id);
    if (pos) {
      entity.x = pos.x;
      entity.y = pos.y;
      console.log(`📍 "${entity.name}" at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
    }
    entities.push(entity);
  });

  console.log(`✅ Placed ${entities.length} entities using sequential compact layout`);

  console.log(`🔗 Placing ${schemaData.relationships.length} relationships...`);

  // STEP 6: Place relationships at midpoints between connected entities WITH collision avoidance
  // NOTE: This happens AFTER all entities are placed, ensuring proper order:
  // 1) All entities positioned first
  // 2) Relationship diamonds positioned at midpoints (with collision check)
  // 3) Lines drawn last (in Canvas.tsx)
  
  const RELATIONSHIP_SIZE = 130; // Diamond is 130x130
  const REL_SPACING = 100; // Minimum spacing from entities and other relationships (increased for safety)
  
  schemaData.relationships.forEach((rel, index) => {
    const fromEntity = entities.find(e => e.name === rel.fromTable);
    const toEntity = entities.find(e => e.name === rel.toTable);

    if (fromEntity && toEntity) {
      // Mark foreign key attributes
      const fromAttr = fromEntity.attributes.find(a => a.name === rel.fromColumn);
      const toAttr = toEntity.attributes.find(a => a.name === rel.toColumn);

      if (fromAttr) fromAttr.isForeignKey = true;
      if (toAttr) toAttr.isForeignKey = true;

      // Calculate ideal midpoint between entities
      let x = (fromEntity.x + toEntity.x) / 2;
      let y = (fromEntity.y + toEntity.y) / 2;
      
      // Check for collisions using proper rectangle intersection
      const checkRelationshipOverlap = (rx: number, ry: number): boolean => {
        const relHalfSize = RELATIONSHIP_SIZE / 2;
        
        // Relationship bounding box (center at rx, ry)
        const relLeft = rx - relHalfSize;
        const relRight = rx + relHalfSize;
        const relTop = ry - relHalfSize;
        const relBottom = ry + relHalfSize;
        
        // Check against all entities using proper rectangle collision
        for (const entity of entities) {
          const entityLeft = entity.x - REL_SPACING;
          const entityRight = entity.x + 180 + REL_SPACING; // Entity width + spacing
          const entityTop = entity.y - REL_SPACING;
          const entityBottom = entity.y + 70 + REL_SPACING; // Entity height + spacing
          
          // Rectangle intersection check
          const overlaps = !(relRight < entityLeft || 
                            relLeft > entityRight || 
                            relBottom < entityTop || 
                            relTop > entityBottom);
          
          if (overlaps) {
            return true; // Overlap with entity detected
          }
        }
        
        // Check against already placed relationships
        for (const existingRel of relationships) {
          const existingLeft = existingRel.x - relHalfSize - REL_SPACING;
          const existingRight = existingRel.x + relHalfSize + REL_SPACING;
          const existingTop = existingRel.y - relHalfSize - REL_SPACING;
          const existingBottom = existingRel.y + relHalfSize + REL_SPACING;
          
          // Rectangle intersection check
          const overlaps = !(relRight < existingLeft || 
                            relLeft > existingRight || 
                            relBottom < existingTop || 
                            relTop > existingBottom);
          
          if (overlaps) {
            return true; // Overlap with another relationship detected
          }
        }
        
        return false; // No overlap
      };
      
      // If midpoint has overlap, try to offset it
      if (checkRelationshipOverlap(x, y)) {
        console.log(`⚠️ Relationship "${rel.fromTable}-${rel.toTable}" midpoint has overlap, adjusting...`);
        
        // Try offsets: perpendicular to line between entities
        const dx = toEntity.x - fromEntity.x;
        const dy = toEntity.y - fromEntity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          // Perpendicular vector (rotated 90 degrees)
          const perpX = -dy / dist;
          const perpY = dx / dist;
          
          const offsets = [
            { x: perpX * 80, y: perpY * 80 },     // Small offset up/left
            { x: -perpX * 80, y: -perpY * 80 },   // Small offset down/right
            { x: perpX * 120, y: perpY * 120 },   // Medium offset up/left
            { x: -perpX * 120, y: -perpY * 120 }, // Medium offset down/right
            { x: perpX * 180, y: perpY * 180 },   // Large offset up/left
            { x: -perpX * 180, y: -perpY * 180 }, // Large offset down/right
            { x: perpX * 250, y: perpY * 250 },   // Extra large offset up/left
            { x: -perpX * 250, y: -perpY * 250 }, // Extra large offset down/right
          ];
          
          for (const offset of offsets) {
            const testX = x + offset.x;
            const testY = y + offset.y;
            
            if (!checkRelationshipOverlap(testX, testY)) {
              x = testX;
              y = testY;
              console.log(`✓ Adjusted to (${Math.round(x)}, ${Math.round(y)})`);
              break;
            }
          }
        }
      }

      const relationship: Relationship = {
        id: `rel-${Date.now()}-${index}`,
        name: generateRelationshipName(rel.fromTable, rel.toTable, rel.relationshipName),
        x,
        y,
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        cardinality: '1:N',
        fromCardinality: '1',
        toCardinality: 'N',
        animationIndex: entities.length + index, // Animate after entities
      };

      relationships.push(relationship);
      
      console.log(`✅ Placed relationship "${relationship.name}" at midpoint (${Math.round(x)}, ${Math.round(y)})`);
    }
  });

  // STEP 6: Auto-layout attributes around their parent entities
  console.log('🎯 Auto-positioning attributes...');
  const attributePositions = layoutAllAttributes(entities);
  applyAttributePositions(entities, attributePositions);
  console.log(`✅ Positioned ${attributePositions.size} attributes`);

  console.log('🎉 Tree-based radial layout complete!');
  return { entities, relationships };
}

/**
 * Transform frontend entities and relationships to backend schema
 */
export function frontendToBackend(
  entities: Entity[], 
  relationships: Relationship[]
): BackendSchema {
  const tables: BackendTable[] = [];
  const backendRelationships: BackendRelationship[] = [];

  // Convert entities to tables
  entities.forEach(entity => {
    // Convert attributes to backend format
    const attributes: string[] = entity.attributes.map(attr => attr.name);
    const columns = entity.attributes.map(attr => ({
      name: attr.name,
      type: attr.type,
    }));

    // Include sample data if it exists
    // Map values from attribute IDs to attribute names for backend storage
    const sampleData = entity.sampleData && entity.sampleData.length > 0
      ? entity.sampleData.map(row => {
          // Convert values from attribute ID keys to attribute name keys
          const valuesByName: Record<string, string> = {};
          entity.attributes.forEach(attr => {
            const value = row.values[attr.id] || '';
            valuesByName[attr.name] = value;
          });
          return {
            id: row.id,
            values: valuesByName, // Store by attribute name for backend
          };
        })
      : undefined;

    const table: BackendTable = {
      name: entity.name,
      attributes,
      columns,
      ...(sampleData && sampleData.length > 0 && { sampleData }), // Only include if not empty
    };

    tables.push(table);
  });

  // Convert relationships to backend format
  relationships.forEach(rel => {
    const fromEntity = entities.find(e => e.id === rel.fromEntityId);
    const toEntity = entities.find(e => e.id === rel.toEntityId);

    if (fromEntity && toEntity) {
      // Find the foreign key attribute in the from entity
      const fromAttr = fromEntity.attributes.find(a => a.isForeignKey);
      const toAttr = toEntity.attributes.find(a => a.name.toLowerCase().endsWith('_id'));

      if (fromAttr && toAttr) {
        const backendRel: BackendRelationship = {
          fromTable: fromEntity.name,
          fromColumn: fromAttr.name,
          toTable: toEntity.name,
          toColumn: toAttr.name,
        };

        backendRelationships.push(backendRel);
      }
    }
  });

  return {
    tables,
    relationships: backendRelationships,
  };
}

/**
 * Parse saved schema data from backend (JSON string) to frontend format
 */
export async function parseSavedSchema(schemaDataString: string): Promise<{
  entities: Entity[];
  relationships: Relationship[];
}> {
  try {
    const schemaData = JSON.parse(schemaDataString);
    return await backendToFrontend(schemaData);
  } catch (error) {
    console.error('Error parsing saved schema:', error);
    return { entities: [], relationships: [] };
  }
}

/**
 * Generate a unique ID for new elements (matching App.tsx pattern)
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Auto-layout entities in a grid pattern (alternative to circle)
 */
export function autoLayoutGrid(entities: Entity[]): Entity[] {
  const cols = Math.ceil(Math.sqrt(entities.length));
  const spacing = 250;
  const startX = 200;
  const startY = 200;

  return entities.map((entity, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      ...entity,
      x: startX + col * spacing,
      y: startY + row * spacing,
    };
  });
}

/**
 * Auto-layout entities in a circle pattern (default)
 */
export function autoLayoutCircle(entities: Entity[]): Entity[] {
  const radius = LAYOUT_CONFIG.radius;
  const centerX = LAYOUT_CONFIG.centerX;
  const centerY = LAYOUT_CONFIG.centerY;

  return entities.map((entity, index) => {
    const angle = (index * (360 / entities.length)) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    return {
      ...entity,
      x,
      y,
    };
  });
}
