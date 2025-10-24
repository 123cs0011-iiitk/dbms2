import React from 'react';
import { Entity, Relationship } from '../App';

export type TableColumn = {
  name: string;
  type: string;
};

export type TableNodeData = {
  tableName: string;
  columns: TableColumn[];
  values: string[][];
  primaryKey: string;
  primaryKeys: string[];
  foreignKeys: {
    column: string;
    referencesTable?: string;
    referencesColumn?: string;
    refTableId?: string;
    refColumn?: string;
  }[];
};

export type TableNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: TableNodeData;
};

export type TableEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: any;
  label?: string | React.ReactNode;
  data?: {
    originalRelationshipName?: string; // Store original semantic name
  };
};

/**
 * Convert entities and relationships to table nodes and edges
 */
export function entitiesToTables(
  entities: Entity[],
  relationships: Relationship[]
): { nodes: TableNode[]; edges: TableEdge[] } {
  const nodes: TableNode[] = entities.map((entity, index) => {
    // Convert attributes to columns
    const columns: TableColumn[] = entity.attributes.map((attr) => ({
      name: attr.name,
      type: attr.type,
    }));

    // Convert sample data to values format
    const values: string[][] = [];
    if (entity.sampleData && entity.sampleData.length > 0) {
      // Transpose data from row-based to column-based format
      const numRows = entity.sampleData.length;
      const numCols = entity.attributes.length;

      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const row: string[] = [];
        for (let colIdx = 0; colIdx < numCols; colIdx++) {
          const attr = entity.attributes[colIdx];
          const value = entity.sampleData[rowIdx].values[attr.id];
          row.push(value || '');
        }
        values.push(row);
      }
    }

    // Transpose values to column-based format (as expected by TableNode)
    const columnValues: string[][] = [];
    if (values.length > 0) {
      const numCols = entity.attributes.length;
      for (let colIdx = 0; colIdx < numCols; colIdx++) {
        const colData: string[] = [];
        for (let rowIdx = 0; rowIdx < values.length; rowIdx++) {
          colData.push(values[rowIdx][colIdx] || '');
        }
        columnValues.push(colData);
      }
    } else {
      // Initialize empty column arrays
      entity.attributes.forEach(() => columnValues.push([]));
    }

    // Find primary keys
    const primaryKeys = entity.attributes
      .filter((attr) => attr.isPrimaryKey)
      .map((attr) => attr.name);
    const primaryKey = primaryKeys.length === 1 ? primaryKeys[0] : '';

    // Find foreign keys
    const foreignKeys = entity.attributes
      .filter((attr) => attr.isForeignKey)
      .map((attr) => ({
        column: attr.name,
        referencesTable: '', // Will be filled from relationships
        referencesColumn: 'id',
      }));

    // Ensure reasonable positioning for tables with improved spacing
    // Table mode requires more space due to larger node size (500x300px typical)
    const x = entity.x || 150 + (index % 2) * 900; // Increased to 900px horizontal spacing
    const y = entity.y || 150 + Math.floor(index / 2) * 500; // Increased to 500px vertical spacing

    return {
      id: entity.id,
      type: 'tableNode',
      position: { x, y },
      data: {
        tableName: entity.name,
        columns,
        values: columnValues,
        primaryKey,
        primaryKeys,
        foreignKeys,
      },
    };
  });

  // Convert relationships to edges
  const edges: TableEdge[] = relationships.map((rel) => {
    const fromEntity = entities.find((e) => e.id === rel.fromEntityId);
    const toEntity = entities.find((e) => e.id === rel.toEntityId);

    // Find foreign key column (if any)
    const fromFkAttr = fromEntity?.attributes.find((a) => a.isForeignKey);

    // For table view, show foreign key reference
    let label = rel.name;
    if (fromFkAttr && toEntity) {
      label = `${fromFkAttr.name} → ${toEntity.attributes.find(a => a.isPrimaryKey)?.name || 'id'}`;
    }

    return {
      id: rel.id,
      source: rel.fromEntityId,
      target: rel.toEntityId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      label,
      data: {
        originalRelationshipName: rel.name, // Preserve original semantic name
      },
    };
  });

  return { nodes, edges };
}

/**
 * Convert table nodes and edges back to entities and relationships
 */
export function tablesToEntities(
  nodes: TableNode[],
  edges: TableEdge[]
): { entities: Entity[]; relationships: Relationship[] } {
  const entities: Entity[] = nodes.map((node, index) => {
    // Convert columns to attributes
    const attributes = node.data.columns.map((column, idx) => {
      const isPrimaryKey = node.data.primaryKeys?.includes(column.name) || 
                           column.name === node.data.primaryKey;
      const isForeignKey = node.data.foreignKeys?.some(
        (fk) => fk.column === column.name
      );

      return {
        id: `attr-${node.id}-${idx}`,
        name: column.name,
        type: column.type,
        isPrimaryKey,
        isForeignKey,
        isNullable: !isPrimaryKey,
        isUnique: isPrimaryKey,
      };
    });

    // Convert values to sample data
    const sampleData: Entity['sampleData'] = [];
    if (node.data.values && node.data.values.length > 0 && node.data.values[0].length > 0) {
      const numRows = node.data.values[0].length;
      
      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const rowValues: { [key: string]: string } = {};
        
        node.data.columns.forEach((_, colIdx) => {
          const attrId = `attr-${node.id}-${colIdx}`;
          const value = node.data.values[colIdx]?.[rowIdx] || '';
          rowValues[attrId] = value;
        });

        sampleData.push({
          id: `row-${node.id}-${rowIdx}`,
          values: rowValues,
        });
      }
    }

    // Use table positions, but ensure they're reasonable for ER diagram view
    // The auto-layout will reposition them nicely, but this gives a good starting point
    const x = node.position?.x || 300 + index * 200;
    const y = node.position?.y || 200 + index * 150;

    return {
      id: node.id,
      name: node.data.tableName,
      x,
      y,
      color: '#7aa2f7',
      attributes,
      sampleData,
    };
  });

  // Convert edges to relationships
  const relationships: Relationship[] = edges.map((edge) => {
    const fromEntity = entities.find((e) => e.id === edge.source);
    const toEntity = entities.find((e) => e.id === edge.target);

    // Calculate midpoint for relationship position
    const x = fromEntity && toEntity 
      ? (fromEntity.x + toEntity.x) / 2 
      : 400;
    const y = fromEntity && toEntity 
      ? (fromEntity.y + toEntity.y) / 2 
      : 300;

    // Restore original semantic relationship name if it was preserved
    const relationshipName = edge.data?.originalRelationshipName || 
                            (typeof edge.label === 'string' ? edge.label : 'Relates');

    return {
      id: edge.id,
      name: relationshipName,
      x,
      y,
      fromEntityId: edge.source,
      toEntityId: edge.target,
      cardinality: '1:N',
      fromCardinality: '1',
      toCardinality: 'N',
    };
  });

  return { entities, relationships };
}

