import type { Entity, Attribute, Relationship } from '../App';

// Backend schema types (matching the Python backend)
export interface BackendTable {
  name: string;
  attributes: string[];
  columns: Array<{
    name: string;
    type: string;
  }>;
}

export interface BackendRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
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
 * Transform backend schema to frontend entities and relationships
 */
export function backendToFrontend(schemaData: BackendSchema): {
  entities: Entity[];
  relationships: Relationship[];
} {
  if (!schemaData || !schemaData.tables) {
    return { entities: [], relationships: [] };
  }

  const entities: Entity[] = [];
  const relationships: Relationship[] = [];

  // Convert tables to entities
  const viewportCenter = getViewportCenter();
  const radius = Math.min(300, Math.max(200, schemaData.tables.length * 80)); // Dynamic radius
  
  schemaData.tables.forEach((table, index) => {
    // Auto-layout entities in a circle centered in viewport
    const angle = (index * (360 / schemaData.tables.length)) * (Math.PI / 180);
    const x = viewportCenter.x + Math.cos(angle) * radius;
    const y = viewportCenter.y + Math.sin(angle) * radius;

    // Convert attributes to frontend format
    const attributes: Attribute[] = table.attributes.map((attrName, attrIndex) => {
      // Find corresponding column data
      const columnData = table.columns.find(col => col.name === attrName);
      const dataType = columnData?.type || 'TEXT';

      return {
        id: `${table.name}-attr-${attrIndex}-${Date.now()}`,
        name: attrName,
        type: dataType,
        isPrimaryKey: attrName.toLowerCase().endsWith('_id') && !attrName.toLowerCase().endsWith('name'),
        isForeignKey: false, // Will be set when processing relationships
        isNullable: !attrName.toLowerCase().includes('name') && !attrName.toLowerCase().endsWith('_id'),
        isUnique: attrName.toLowerCase().includes('email'),
      };
    });

    // Create entity
    const entity: Entity = {
      id: `entity-${Date.now()}-${index}`,
      name: table.name,
      x,
      y,
      color: ENTITY_COLORS[index % ENTITY_COLORS.length],
      attributes,
    };

    entities.push(entity);
  });

  // Convert relationships
  schemaData.relationships.forEach((rel, index) => {
    // Find corresponding entities
    const fromEntity = entities.find(e => e.name === rel.fromTable);
    const toEntity = entities.find(e => e.name === rel.toTable);

    if (fromEntity && toEntity) {
      // Mark foreign key attributes
      const fromAttr = fromEntity.attributes.find(a => a.name === rel.fromColumn);
      const toAttr = toEntity.attributes.find(a => a.name === rel.toColumn);

      if (fromAttr) fromAttr.isForeignKey = true;
      if (toAttr) toAttr.isForeignKey = true;

      // Calculate relationship position (midpoint between entities)
      const x = (fromEntity.x + toEntity.x) / 2;
      const y = (fromEntity.y + toEntity.y) / 2;

      const relationship: Relationship = {
        id: `rel-${Date.now()}-${index}`,
        name: 'Relates',
        x,
        y,
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        cardinality: '1:N',
        fromCardinality: '1',
        toCardinality: 'N',
      };

      relationships.push(relationship);
    }
  });

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

    const table: BackendTable = {
      name: entity.name,
      attributes,
      columns,
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
export function parseSavedSchema(schemaDataString: string): {
  entities: Entity[];
  relationships: Relationship[];
} {
  try {
    const schemaData = JSON.parse(schemaDataString);
    return backendToFrontend(schemaData);
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
