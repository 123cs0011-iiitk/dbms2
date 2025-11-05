import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas } from './components/Canvas';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  Controls,
  Background,
  Node,
  Connection,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './components/TableNode';
import { Toolbar } from './components/Toolbar';
import { FloatingToolbar } from './components/FloatingToolbar';
import { RightSidebar } from './components/RightSidebar';
import { PromptModal } from './components/PromptModal';
import { ExportModal } from './components/ExportModal';
import { TestModal } from './components/TestModal';
import { SavedSchemasModal } from './components/SavedSchemasModal';
import { SQLPreview } from './components/SQLPreview';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { AddEntityModal } from './components/AddEntityModal';
import { AddRelationshipModal } from './components/AddRelationshipModal';
import { Toaster } from './components/ui/sonner';
import { saveSchema, resetDatabase } from './services/api';
import { frontendToBackend } from './utils/schemaTransform';
import { calculateTreeLayout } from './utils/treeLayout';
import { toast } from 'sonner';
import { entitiesToTables, tablesToEntities, TableNode as TableNodeType } from './utils/modeConversion';
import { calculateTableStackLayout, getTableViewportCenter } from './utils/tableLayout';
import { Edge } from 'reactflow';
import { 
  calculateExpansionFactor, 
  expandLayout, 
  storeOriginalPositions, 
  restoreOriginalPositions,
  clearAttributeCustomPositions,
  type PositionStore
} from './utils/layoutExpansion';
import { layoutAllAttributes, applyAttributePositions } from './utils/attributeLayout';

export type Entity = {
  id: string;
  name: string;
  x: number;
  y: number;
  attributes: Attribute[];
  color?: string;
  sampleData?: SampleData[];
  animationIndex?: number;
};

export type SampleData = {
  id: string;
  values: { [key: string]: string };
};

export type Attribute = {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  x: number;
  y: number;
  entityId: string;
  customX?: number;
  customY?: number;
};

export type Relationship = {
  id: string;
  name: string;
  x: number;
  y: number;
  fromEntityId: string;
  toEntityId: string;
  cardinality: string;
  fromCardinality?: string;
  toCardinality?: string;
  animationIndex?: number;
};

export type ViewMode = 'er-diagram' | 'table';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('er-diagram');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [tableNodes, setTableNodes] = useState<TableNodeType[]>([]);
  const [tableEdges, setTableEdges] = useState<Edge[]>([]);
  const [selectedElement, setSelectedElement] = useState<{ type: 'entity' | 'relationship' | 'attribute'; id: string } | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSavedSchemasModal, setShowSavedSchemasModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [showAddRelationshipModal, setShowAddRelationshipModal] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showAttributes, setShowAttributes] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showSqlSeparators, setShowSqlSeparators] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [zoom, setZoom] = useState(100);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [originalPositions, setOriginalPositions] = useState<PositionStore | null>(null);
  const tableFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Apply dark mode class to document root for portal-rendered components
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto-zoom to fit all content
  const calculateAndSetZoom = useCallback((items: Array<{ x: number; y: number }>, itemWidth: number = 200, itemHeight: number = 150) => {
    if (items.length === 0) {
      setZoom(100);
      return;
    }

    // Calculate bounding box
    const padding = 100;
    const minX = Math.min(...items.map(item => item.x)) - padding;
    const maxX = Math.max(...items.map(item => item.x)) + itemWidth + padding;
    const minY = Math.min(...items.map(item => item.y)) - padding;
    const maxY = Math.max(...items.map(item => item.y)) + itemHeight + padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Get viewport dimensions (subtract toolbar and status bar)
    const viewportWidth = window.innerWidth - 100; // Account for sidebars
    const viewportHeight = window.innerHeight - 180; // Account for toolbar and status bar

    // Calculate zoom to fit
    const zoomX = (viewportWidth / contentWidth) * 100;
    const zoomY = (viewportHeight / contentHeight) * 100;
    const newZoom = Math.min(zoomX, zoomY, 100); // Don't zoom in beyond 100%

    setZoom(Math.max(25, Math.floor(newZoom))); // Minimum 25% zoom
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(200, prev + 10)); // Max 200%
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(25, prev - 10)); // Min 25%
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

  // SQL Separators handler
  const toggleSqlSeparators = useCallback(() => {
    setShowSqlSeparators(prev => !prev);
  }, []);

  // Handle attribute visibility toggle with layout expansion/contraction
  const handleToggleAttributes = useCallback(() => {
    setShowAttributes(prev => {
      const newValue = !prev;
      
      if (newValue) {
        // SHOWING ATTRIBUTES - Expand layout
        console.log('🔄 Showing attributes - expanding layout...');
        console.log(`📊 Current entities: ${entities.length}`);
        
        // 1. Store original positions
        const stored = storeOriginalPositions(entities, relationships);
        setOriginalPositions(stored);
        
        // 2. Calculate expansion factor based on attribute count
        const factor = calculateExpansionFactor(entities);
        console.log(`📏 Expansion factor: ${factor.toFixed(2)}x`);
        
        // 3. Expand entities and relationships
        const { entities: expandedEntities, relationships: expandedRelationships } = 
          expandLayout(entities, relationships, factor);
        
        // 4. Layout attributes around expanded entities
        const attributePositions = layoutAllAttributes(expandedEntities);
        applyAttributePositions(expandedEntities, attributePositions);
        
        console.log(`✅ Positioned ${attributePositions.size} attributes`);
        
        // 5. Deep clone entities to ensure React detects all changes (including nested attributes)
        const deepClonedEntities = expandedEntities.map(entity => ({
          ...entity,
          attributes: entity.attributes ? entity.attributes.map(attr => ({ ...attr })) : []
        }));
        
        // 6. Update state
        setEntities(deepClonedEntities);
        setRelationships([...expandedRelationships]);
        
        console.log('✅ Layout expanded and attributes positioned');
      } else {
        // HIDING ATTRIBUTES - Contract layout
        console.log('🔄 Hiding attributes - contracting layout...');
        
        if (originalPositions) {
          // 1. Restore original positions
          const { entities: restoredEntities, relationships: restoredRelationships } = 
            restoreOriginalPositions(entities, relationships, originalPositions);
          
          // 2. Clear custom attribute positions
          const clearedEntities = clearAttributeCustomPositions(restoredEntities);
          
          // 3. Deep clone to ensure React detects changes
          const deepClonedEntities = clearedEntities.map(entity => ({
            ...entity,
            attributes: entity.attributes ? entity.attributes.map(attr => ({ ...attr })) : []
          }));
          
          // 4. Update state
          setEntities(deepClonedEntities);
          setRelationships([...restoredRelationships]);
          setOriginalPositions(null);
          
          console.log('✅ Layout contracted to original positions');
        }
      }
      
      return newValue;
    });
  }, [entities, relationships, originalPositions]);

  // Auto-zoom for ER diagram mode
  useEffect(() => {
    if (viewMode === 'er-diagram' && entities.length > 0) {
      const timer = setTimeout(() => {
        calculateAndSetZoom(entities, 250, 200); // Entity width ~250px, height ~200px
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [entities.length, viewMode, calculateAndSetZoom]);

  // Auto-zoom for table mode
  useEffect(() => {
    if (viewMode === 'table' && tableNodes.length > 0) {
      const timer = setTimeout(() => {
        const tablePositions = tableNodes.map(node => ({ x: node.position.x, y: node.position.y }));
        calculateAndSetZoom(tablePositions, 500, 300); // Table width ~500px, height ~300px
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [tableNodes.length, viewMode, calculateAndSetZoom]);

  const handleViewModeChange = (mode: ViewMode) => {
    const prevMode = viewMode;
    
    // Only convert if mode actually changes
    if (mode !== prevMode) {
      if (mode === 'table' && entities.length > 0) {
        // Convert entities to tables when switching to table mode
        const { nodes, edges } = entitiesToTables(entities, relationships);
        
        // Apply vertical stack layout to tables immediately
        const viewportCenter = getTableViewportCenter();
        const newPositions = calculateTableStackLayout(
          nodes as any[],
          viewportCenter
        );
        
        // Update node positions with compact layout
        const layoutNodes = nodes.map(node => {
          const newPos = newPositions.get(node.id);
          if (newPos) {
            return {
              ...node,
              position: { x: newPos.x, y: newPos.y },
              // Clear any cached position
              positionAbsolute: undefined,
            } as any;
          }
          return node;
        });
        
        // Force React Flow update with new array reference
        setTableNodes([...layoutNodes] as any);
        setTableEdges(edges);
        
        console.log('✅ Tables initialized with compact layout:', layoutNodes.map(n => ({ 
          id: n.id, 
          name: n.data.tableName, 
          pos: n.position 
        })));
        
        // Force React Flow to fit view after a brief delay
        setTimeout(() => {
          if (tableFlowInstanceRef.current) {
            tableFlowInstanceRef.current.fitView({ padding: 0.2, duration: 300 });
          }
        }, 150);
      } else if (mode === 'er-diagram' && tableNodes.length > 0) {
        // Convert tables to entities when switching to ER diagram mode
        const { entities: convertedEntities, relationships: convertedRelationships } = 
          tablesToEntities(tableNodes, tableEdges);
        setEntities(convertedEntities);
        setRelationships(convertedRelationships);
        
        // Trigger auto-layout using the same algorithm as Auto Layout button
        setTimeout(() => {
          if (convertedEntities.length > 0) {
            const viewportCenter = getViewportCenter();
            
            // Calculate optimal positions using sequential layout - no overlaps
            const newPositions = calculateTreeLayout(convertedEntities, convertedRelationships, viewportCenter);
            
            // Update entity positions
            const layoutEntities = convertedEntities.map(entity => {
              const newPos = newPositions.get(entity.id);
              if (newPos) {
                return { ...entity, x: newPos.x, y: newPos.y };
              }
              return entity;
            });
            
            setEntities(layoutEntities);
            
            // Recalculate relationship positions at midpoints
            const updatedRelationships = convertedRelationships.map(rel => {
              const fromEntity = layoutEntities.find(e => e.id === rel.fromEntityId);
              const toEntity = layoutEntities.find(e => e.id === rel.toEntityId);
              
              if (fromEntity && toEntity) {
                return {
                  ...rel,
                  x: (fromEntity.x + toEntity.x) / 2,
                  y: (fromEntity.y + toEntity.y) / 2
                };
              }
              return rel;
            });
            
            setRelationships(updatedRelationships);
          }
        }, 50);
      }
    }
    
    setViewMode(mode);
    setHasUnsavedChanges(true);
  };

  // Table mode handlers
  const handleAddColumn = useCallback(
    (nodeId: string, colName: string, colType: string = 'TEXT') => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: [...n.data.columns, { name: colName, type: colType }],
                  values: [...n.data.values, []],
                },
              }
            : n
        )
      );
    },
    []
  );

  const handleRenameTable = useCallback(
    (nodeId: string, name: string) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, tableName: name } } : n
        )
      );
    },
    []
  );

  const handleRenameColumn = useCallback(
    (nodeId: string, idx: number, newName: string) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: n.data.columns.map((c, i) =>
                    i === idx ? { ...c, name: newName } : c
                  ),
                },
              }
            : n
        )
      );
    },
    []
  );

  const handleChangeColumnType = useCallback(
    (nodeId: string, idx: number, newType: string) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: n.data.columns.map((c, i) =>
                    i === idx ? { ...c, type: newType } : c
                  ),
                },
              }
            : n
        )
      );
    },
    []
  );

  const handleRemoveColumn = useCallback(
    (nodeId: string, idx: number) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.id !== nodeId) return n;
          const colName = n.data.columns[idx]?.name;
          const nextCols = n.data.columns.filter((_, i) => i !== idx);
          const nextVals = n.data.values.filter((_, i) => i !== idx);
          const nextPK = n.data.primaryKeys?.includes(colName) ? [] : n.data.primaryKeys;
          return {
            ...n,
            data: { ...n.data, columns: nextCols, values: nextVals, primaryKeys: nextPK },
          };
        })
      );
    },
    []
  );

  const handleAddRow = useCallback(
    (nodeId: string, rowValues: string[]) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.id !== nodeId) return n;

          // Ensure values structure matches columns
          let values = n.data.values || [];
          const columns = n.data.columns.map((c) => c.name);
          if (values.length !== columns.length) {
            values = columns.map((_, idx) => (values[idx] ? values[idx] : []));
          }
          const primaryKeys = n.data.primaryKeys || [];

          // Normalize row values length to number of columns
          const normalizedRow = columns.map((_, idx) => {
            const v = rowValues[idx];
            return v === undefined || v === null ? '' : String(v);
          });

          // If all values are empty and no PK set, ignore
          const allEmpty = normalizedRow.every((v) => v.trim() === '');
          if (primaryKeys.length === 0 && allEmpty) {
            return n;
          }

          // PK validation: non-null and unique
          if (primaryKeys.length > 0) {
            for (const pkCol of primaryKeys) {
              const pkIndex = columns.indexOf(pkCol);
              if (pkIndex >= 0) {
                const pkValue = normalizedRow[pkIndex];
                if (pkValue === undefined || pkValue === null || String(pkValue).trim() === '') {
                  alert(`Primary key '${pkCol}' cannot be empty.`);
                  return n;
                }
                const existing = n.data.values[pkIndex] || [];
                if (existing.some((v) => String(v).trim() === String(pkValue).trim())) {
                  alert(`Duplicate primary key value '${pkValue}' in column '${pkCol}'.`);
                  return n;
                }
              }
            }
          }

          const nextValues = values.map((colValues, idx) => {
            const incoming = normalizedRow[idx];
            return [...colValues, incoming];
          });

          return { ...n, data: { ...n.data, values: nextValues } };
        })
      );
    },
    []
  );

  const handleUpdateCell = useCallback(
    (nodeId: string, rowIdx: number, colIdx: number, value: string) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.id !== nodeId) return n;
          const col = n.data.columns[colIdx];
          const val = String(value ?? '');
          // basic type checks; silently ignore invalid
          const trimmed = val.trim();
          if (trimmed !== '') {
            if (col.type === 'INTEGER' && !/^\-?\d+$/.test(trimmed)) return n;
            if (col.type === 'REAL' && isNaN(Number(trimmed))) return n;
            if (col.type === 'BOOLEAN') {
              const lower = trimmed.toLowerCase();
              const ok = ['true', 'false', '1', '0', 'yes', 'no'].includes(lower);
              if (!ok) return n;
            }
          }
          const nextValues = n.data.values.map((colValues, idx) => {
            if (idx !== colIdx) return colValues;
            const copy = [...colValues];
            copy[rowIdx] = val;
            return copy;
          });
          return { ...n, data: { ...n.data, values: nextValues } };
        })
      );
    },
    []
  );

  const handleRemoveRow = useCallback(
    (nodeId: string, rowIdx: number) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextValues = n.data.values.map((colValues) => colValues.filter((_, i) => i !== rowIdx));
          return { ...n, data: { ...n.data, values: nextValues } };
        })
      );
    },
    []
  );

  const handleSetPrimaryKey = useCallback(
    (nodeId: string, colName: string) => {
      setTableNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (n.id !== nodeId) return n;

          const currentPrimaryKeys = n.data.primaryKeys || [];
          let newPrimaryKeys: string[];

          if (currentPrimaryKeys.includes(colName)) {
            // Remove from primary keys
            newPrimaryKeys = currentPrimaryKeys.filter((pk) => pk !== colName);
          } else {
            // Add to primary keys
            newPrimaryKeys = [...currentPrimaryKeys, colName];
          }

          return {
            ...n,
            data: {
              ...n.data,
              primaryKeys: newPrimaryKeys,
              // Keep backward compatibility with single primaryKey
              primaryKey: newPrimaryKeys.length === 1 ? newPrimaryKeys[0] : '',
            },
          };
        })
      );
    },
    []
  );

  const handleDeleteTable = useCallback(
    (nodeId: string) => {
      setTableNodes((currentNodes) => currentNodes.filter((n) => n.id !== nodeId));
      setTableEdges((currentEdges) => currentEdges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    []
  );

  const addEntity = (name: string = 'Entity', attributes?: Attribute[], connectToEntityId?: string | null, relationshipName?: string, fromCardinality?: string, toCardinality?: string) => {
    const id = `entity-${Date.now()}`;
    const x = 300 + Math.random() * 200;
    const y = 200 + Math.random() * 200;
    
    const newEntity: Entity = {
      id,
      name,
      x,
      y,
      color: '#7aa2f7',
      attributes: attributes || [
        {
          id: `attr-${Date.now()}`,
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
          x: x + 90 - 70,
          y: y + 35 + 200 - 18,
          entityId: id,
        },
        {
          id: `attr-${Date.now()}-1`,
          name: 'name',
          type: 'VARCHAR(100)',
          isNullable: false,
          x: x + 90 - 70,
          y: y + 35 + 200 - 18,
          entityId: id,
        },
      ],
    };
    const updatedEntities = [...entities, newEntity];
    setEntities(updatedEntities);
    
    // If connectToEntityId is provided, create a relationship
    if (connectToEntityId && relationshipName) {
      const connectedEntity = updatedEntities.find(e => e.id === connectToEntityId);
      if (connectedEntity) {
        const fromCard = fromCardinality || '1';
        const toCard = toCardinality || 'N';
        const newRelationship: Relationship = {
          id: `rel-${Date.now()}`,
          name: relationshipName,
          x: (newEntity.x + connectedEntity.x) / 2,
          y: (newEntity.y + connectedEntity.y) / 2,
          fromEntityId: connectToEntityId,
          toEntityId: newEntity.id,
          cardinality: `${fromCard}:${toCard}`,
          fromCardinality: fromCard,
          toCardinality: toCard,
        };
        setRelationships([...relationships, newRelationship]);
      }
    }
    
    setHasUnsavedChanges(true);
    toast.success(`Entity "${name}" added successfully!`);
  };

  const addRelationship = (name: string, fromEntityId: string, toEntityId: string, fromCardinality: string = '1', toCardinality: string = 'N') => {
    const fromEntity = entities.find(e => e.id === fromEntityId);
    const toEntity = entities.find(e => e.id === toEntityId);
    
    if (!fromEntity || !toEntity) {
      toast.error('Selected entities not found');
      return;
    }
    
    const newRelationship: Relationship = {
      id: `rel-${Date.now()}`,
      name,
      x: (fromEntity.x + toEntity.x) / 2,
      y: (fromEntity.y + toEntity.y) / 2,
      fromEntityId,
      toEntityId,
      cardinality: `${fromCardinality}:${toCardinality}`,
      fromCardinality,
      toCardinality,
    };
    setRelationships([...relationships, newRelationship]);
    setHasUnsavedChanges(true);
    toast.success(`Relationship "${name}" added successfully!`);
  };

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    const updatedEntities = entities.map(e => {
      if (e.id === id) {
        const updated = { ...e, ...updates };
        
        // If position changed and attributes are visible, recalculate attribute positions
        if ((updates.x !== undefined || updates.y !== undefined) && updated.attributes && showAttributes) {
          updated.attributes = updated.attributes.map((attr, index) => {
            // If user has manually positioned this attribute, preserve the offset
            if (attr.customX !== undefined && attr.customY !== undefined) {
              // Calculate the offset from the old entity position
              const offsetX = attr.customX - e.x;
              const offsetY = attr.customY - e.y;
              
              // Apply the same offset to the new entity position
              return {
                ...attr,
                x: updated.x + offsetX,
                y: updated.y + offsetY,
                customX: updated.x + offsetX,
                customY: updated.y + offsetY,
                entityId: updated.id
              };
            }
            
            // Otherwise, recalculate position based on angle
            const total = updated.attributes?.length || 1;
            const baseRadius = 200 + total * 12;
            const radius = Math.min(Math.max(baseRadius, 160), 320);
            
            let angle;
            if (total === 1) {
              angle = Math.PI / 2;
            } else if (total === 2) {
              angle = index === 0 ? Math.PI / 3 : (2 * Math.PI) / 3;
            } else {
              angle = (index * (360 / total)) * (Math.PI / 180);
            }
            
            return {
              ...attr,
              x: updated.x + 90 + Math.cos(angle) * radius - 70,
              y: updated.y + 35 + Math.sin(angle) * radius - 18,
              entityId: updated.id
            };
          });
        }
        
        return updated;
      }
      return e;
    });
    setEntities(updatedEntities);
    
    // Auto-reposition relationships connected to this entity
    if (updates.x !== undefined || updates.y !== undefined) {
      const updatedRelationships = relationships.map(rel => {
        if (rel.fromEntityId === id || rel.toEntityId === id) {
          const fromEntity = updatedEntities.find(e => e.id === rel.fromEntityId);
          const toEntity = updatedEntities.find(e => e.id === rel.toEntityId);
          
          if (fromEntity && toEntity) {
            return {
              ...rel,
              x: (fromEntity.x + toEntity.x) / 2,
              y: (fromEntity.y + toEntity.y) / 2,
            };
          }
        }
        return rel;
      });
      setRelationships(updatedRelationships);
    }
    
    setHasUnsavedChanges(true);
  };

  const updateRelationship = (id: string, updates: Partial<Relationship>) => {
    setRelationships(relationships.map(r => r.id === id ? { ...r, ...updates } : r));
    setHasUnsavedChanges(true);
  };

  const updateAttributePosition = (attributeId: string, x: number, y: number) => {
    setEntities(entities.map(entity => ({
      ...entity,
      attributes: entity.attributes?.map(attr => 
        attr.id === attributeId 
          ? { ...attr, customX: x, customY: y }
          : attr
      ) || []
    })));
    setHasUnsavedChanges(true);
  };

  const deleteEntity = (id: string) => {
    setEntities(entities.filter(e => e.id !== id));
    setRelationships(relationships.filter(r => r.fromEntityId !== id && r.toEntityId !== id));
    if (selectedElement?.type === 'entity' && selectedElement.id === id) {
      setSelectedElement(null);
    }
    setHasUnsavedChanges(true);
  };

  const deleteRelationship = (id: string) => {
    setRelationships(relationships.filter(r => r.id !== id));
    if (selectedElement?.type === 'relationship' && selectedElement.id === id) {
      setSelectedElement(null);
    }
    setHasUnsavedChanges(true);
  };

  // Table mode: React Flow node types and handlers
  const tableNodeTypes = useMemo(() => ({
    tableNode: (props: any) => (
      <TableNode
        {...props}
        onAddColumn={handleAddColumn}
        onRenameTable={handleRenameTable}
        onRenameColumn={handleRenameColumn}
        onChangeColumnType={handleChangeColumnType}
        onRemoveColumn={handleRemoveColumn}
        onAddRow={handleAddRow}
        onSetPrimaryKey={handleSetPrimaryKey}
        onUpdateCell={handleUpdateCell}
        onRemoveRow={handleRemoveRow}
        onDeleteTable={handleDeleteTable}
      />
    ),
  }), [
    handleAddColumn,
    handleRenameTable,
    handleRenameColumn,
    handleChangeColumnType,
    handleRemoveColumn,
    handleAddRow,
    handleSetPrimaryKey,
    handleUpdateCell,
    handleRemoveRow,
    handleDeleteTable,
  ]);

  const onTableNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, tableNodes as Node[]);
      setTableNodes(updatedNodes as TableNodeType[]);
    },
    [tableNodes]
  );

  const onTableEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, tableEdges);
      setTableEdges(updatedEdges);
    },
    [tableEdges]
  );

  const onTableConnect = useCallback(
    (params: Connection) => {
      const edge = { ...params, animated: true, type: 'smoothstep' };
      const updatedEdges = addEdge(edge, tableEdges);
      setTableEdges(updatedEdges);
    },
    [tableEdges]
  );

  const generateSQL = useCallback(() => {
    if (entities.length === 0) {
      setSqlCode('-- No entities defined yet');
      return;
    }

    let sql = '-- Generated SQL DDL\n\n';
    
    entities.forEach((entity) => {
      sql += `CREATE TABLE IF NOT EXISTS ${entity.name} (\n`;
      
      // Generate columns from attributes
      const columnDefinitions: string[] = [];
      entity.attributes.forEach((attr) => {
        let columnDef = `  ${attr.name} ${attr.type}`;
        
        if (attr.isPrimaryKey) {
          columnDef += ' PRIMARY KEY';
        } else {
          if (attr.isUnique) columnDef += ' UNIQUE';
          if (!attr.isNullable) columnDef += ' NOT NULL';
        }
        
        columnDefinitions.push(columnDef);
      });
      
      sql += columnDefinitions.join(',\n');
      
      // Add foreign key constraints based on relationships
      const entityRelationships = relationships.filter(
        rel => rel.fromEntityId === entity.id || rel.toEntityId === entity.id
      );
      
      const foreignKeys: string[] = [];
      
        entityRelationships.forEach(rel => {
          const toEntity = entities.find(e => e.id === rel.toEntityId);
          
          if (rel.fromEntityId === entity.id && toEntity) {
          // This entity references another entity
          const fkAttr = entity.attributes.find(attr => 
            attr.name.toLowerCase().includes(toEntity.name.toLowerCase()) ||
            attr.name.toLowerCase().endsWith('_id') ||
            attr.isForeignKey
          );
          
          if (fkAttr && toEntity.attributes.length > 0) {
            // Find the primary key of the referenced entity
            const refPrimaryKey = toEntity.attributes.find(a => a.isPrimaryKey) || toEntity.attributes[0];
            if (refPrimaryKey) {
              foreignKeys.push(`  FOREIGN KEY (${fkAttr.name}) REFERENCES ${toEntity.name}(${refPrimaryKey.name})`);
            }
          }
        }
      });
      
      // Also check for explicit foreign key attributes
      entity.attributes.forEach(attr => {
        if (attr.isForeignKey && !foreignKeys.some(fk => fk.includes(attr.name))) {
          // Try to find the referenced entity
          const refEntityName = attr.name.replace(/_id$/i, '').replace(/id$/i, '');
          const refEntity = entities.find(e => 
            e.name.toLowerCase().includes(refEntityName.toLowerCase()) ||
            refEntityName.toLowerCase().includes(e.name.toLowerCase())
          );
          
          if (refEntity && refEntity.attributes.length > 0) {
            const refPrimaryKey = refEntity.attributes.find(a => a.isPrimaryKey) || refEntity.attributes[0];
            if (refPrimaryKey) {
              foreignKeys.push(`  FOREIGN KEY (${attr.name}) REFERENCES ${refEntity.name}(${refPrimaryKey.name})`);
            }
          }
        }
      });
      
      if (foreignKeys.length > 0) {
        sql += ',\n' + foreignKeys.join(',\n');
      }
      
      sql += '\n);\n\n';
      
      // Add sample data if available
      const sampleData = (entity as any).sampleData || [];
      if (sampleData.length > 0) {
        sql += `-- Sample data for ${entity.name}\n`;
        sampleData.forEach((row: any) => {
          const columnNames = entity.attributes.map(attr => attr.name);
          const values = columnNames.map(name => {
            const attr = entity.attributes.find(attr => attr.name === name);
            const value = attr ? row.values[attr.id] : '';
            if (value === null || value === undefined || value === '') {
              return 'NULL';
            }
            // Escape single quotes and wrap in quotes for text types
            const attrType = attr?.type || '';
            if (attrType.includes('TEXT') || attrType.includes('VARCHAR') || attrType.includes('CHAR')) {
              return `'${String(value).replace(/'/g, "''")}'`;
            }
            return String(value);
          });
          
          sql += `INSERT INTO ${entity.name} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        });
        sql += '\n';
      }
    });
    
    setSqlCode(sql);
  }, [entities, relationships]);

  // Track schema structure changes for SQL regeneration (including sample data)
  // Using a more reliable method to detect changes
  const schemaStructure = useMemo(() => {
    const structure = {
      entities: entities.map(e => {
        const sampleData = (e as any).sampleData || [];
        return {
          id: e.id, 
          name: e.name, 
          attributesCount: e.attributes.length,
          attributes: e.attributes.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            isPrimaryKey: a.isPrimaryKey,
            isForeignKey: a.isForeignKey,
            isUnique: a.isUnique,
            isNullable: a.isNullable
          })),
          // Serialize sample data with all values for proper change detection
          sampleDataCount: sampleData.length,
          sampleData: sampleData.map((row: any) => ({
            id: row.id,
            // Create a deterministic string representation of values
            valuesHash: JSON.stringify(Object.keys(row.values || {}).sort().map(key => `${key}:${row.values[key]}`).join('|'))
          }))
        };
      }),
      relationships: relationships.map(r => ({ 
        id: r.id, 
        fromEntityId: r.fromEntityId, 
        toEntityId: r.toEntityId 
      }))
    };
    return JSON.stringify(structure);
  }, [entities, relationships]);

  // Auto-regenerate SQL when schema structure changes
  useEffect(() => {
    // Always regenerate SQL when schema changes if we have entities
    if (entities.length > 0) {
      // Use a small delay to ensure state has fully updated
      const timer = setTimeout(() => {
        generateSQL();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [schemaStructure, generateSQL]);

  // SQL Preview toggle handler - generates SQL if it doesn't exist
  const toggleSqlPreview = useCallback(() => {
    // If no SQL exists yet, generate it first
    if (!sqlCode && entities.length > 0) {
      generateSQL();
      setShowSqlPreview(true);
    } else {
      setShowSqlPreview(prev => !prev);
    }
  }, [sqlCode, entities, generateSQL]);

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

  const autoLayout = () => {
    if (entities.length === 0) return;
    
    // Check if we're in table view mode
    if (viewMode === 'table' && tableNodes.length > 0) {
      // Use vertical stack layout for tables
      const viewportCenter = getTableViewportCenter();
      
      // Calculate stack positions for tables
      const newPositions = calculateTableStackLayout(
        tableNodes as any[],
        viewportCenter
      );
      
      // Update table node positions - force React Flow update
      const updatedTableNodes = tableNodes.map(node => {
        const newPos = newPositions.get(node.id);
        if (newPos) {
          // Create a new node object with updated position
          return {
            ...node,
            position: { x: newPos.x, y: newPos.y },
            // Force React Flow to update by changing positionAbsolute if it exists
            positionAbsolute: undefined,
          } as any;
        }
        return node;
      });
      
      // Force update by creating a new array reference
      setTableNodes([...updatedTableNodes] as any);
      
      // Force React Flow to fit view after layout change
      setTimeout(() => {
        if (tableFlowInstanceRef.current) {
          tableFlowInstanceRef.current.fitView({ padding: 0.2, duration: 300 });
        }
      }, 150);
      
      console.log('✅ Table positions updated:', updatedTableNodes.map(n => ({ 
        id: n.id, 
        name: n.data.tableName, 
        pos: n.position 
      })));
      
      toast.success('Table layout optimized!');
      return;
    }
    
    // Entity/ER diagram view - use sequential compact layout
    const viewportCenter = getViewportCenter();
    
    // Calculate optimal positions using sequential layout - no overlaps
    const newPositions = calculateTreeLayout(entities, relationships, viewportCenter);
    
    // Update entity positions
    const updatedEntities = entities.map(entity => {
      const newPos = newPositions.get(entity.id);
      if (newPos) {
        return { ...entity, x: newPos.x, y: newPos.y };
      }
      return entity;
    });
    
    setEntities(updatedEntities);
    
    // Recalculate relationship positions at midpoints
    const updatedRelationships = relationships.map(rel => {
      const fromEntity = updatedEntities.find(e => e.id === rel.fromEntityId);
      const toEntity = updatedEntities.find(e => e.id === rel.toEntityId);
      
      if (fromEntity && toEntity) {
        return {
          ...rel,
          x: (fromEntity.x + toEntity.x) / 2,
          y: (fromEntity.y + toEntity.y) / 2
        };
      }
      return rel;
    });
    
    setRelationships(updatedRelationships);
    
    toast.success('Layout optimized!');
  };

  const loadSampleDiagram = (sample: any) => {
    setEntities(sample.entities);
    setRelationships(sample.relationships);
    setSqlCode(sample.sql || '');
    setHasUnsavedChanges(false);
  };

  const handleSaveSchema = async () => {
    if (entities.length === 0) {
      toast.error('No entities to save. Create some entities first.');
      return;
    }

    if (!currentPrompt.trim()) {
      const schemaName = window.prompt('Enter a name or description for this schema:');
      if (!schemaName) return;
      setCurrentPrompt(schemaName);
    }

    try {
      // Transform frontend data to backend format
      const schema_json = frontendToBackend(entities, relationships);
      
      // Generate SQL if not exists
      if (!sqlCode) {
        generateSQL();
      }
      
      const result = await saveSchema(currentPrompt, sqlCode, schema_json);
      
      if (result.success) {
        toast.success('Schema saved successfully!');
        setHasUnsavedChanges(false);
      } else {
        toast.error(result.message || 'Failed to save schema');
      }
    } catch (error: any) {
      console.error('Error saving schema:', error);
      toast.error(error.message || 'Failed to save schema');
    }
  };

  const handleReset = async () => {
    try {
      // Call backend to reset database
      const result = await resetDatabase();
      
      if (result.success) {
        // Reset all application state
        setEntities([]);
        setRelationships([]);
        setTableNodes([]);
        setTableEdges([]);
        setSqlCode('');
        setSelectedElement(null);
        setCurrentPrompt('');
        
        // Reset settings to defaults
        setViewMode('er-diagram');
        setZoom(100);
        setIsDarkMode(false);
        
        // Reset UI flags
        setShowRightSidebar(true);
        setShowAttributes(false);
        setHasUnsavedChanges(false);
        
        // Close all modals
        setShowPromptModal(false);
        setShowExportModal(false);
        setShowTestModal(false);
        setShowSavedSchemasModal(false);
        setShowSettingsModal(false);
        
        toast.success('Application reset successfully!');
      } else {
        toast.error(result.message || 'Failed to reset application');
      }
    } catch (error: any) {
      console.error('Error resetting application:', error);
      toast.error(error.message || 'Failed to reset application');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#1a1b26] text-gray-900 dark:text-gray-100 transition-colors">
        <Toolbar
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenPrompt={() => setShowPromptModal(true)}
          onExport={() => setShowExportModal(true)}
          onOpenTest={() => setShowTestModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onSaveSchema={handleSaveSchema}
          onOpenSavedSchemas={() => setShowSavedSchemasModal(true)}
          onReset={handleReset}
          hasEntities={entities.length > 0}
          zoom={zoom}
          onZoomChange={setZoom}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showSqlPreview={showSqlPreview}
          onToggleSqlPreview={toggleSqlPreview}
        />
        
        <div className="flex flex-1 overflow-hidden relative">
          {viewMode === 'er-diagram' && (
            <>
              <FloatingToolbar
                onAddEntity={() => setShowAddEntityModal(true)}
                onAddRelationship={() => {
                  if (entities.length < 2) {
                    toast.error('You need at least 2 entities to create a relationship');
                    return;
                  }
                  setShowAddRelationshipModal(true);
                }}
                onAutoLayout={autoLayout}
                onDelete={() => {
                  if (selectedElement) {
                    if (selectedElement.type === 'entity') {
                      deleteEntity(selectedElement.id);
                    } else {
                      deleteRelationship(selectedElement.id);
                    }
                  }
                }}
                hasSelection={!!selectedElement}
                showAttributes={showAttributes}
                onToggleAttributes={handleToggleAttributes}
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
              />
              
              <Canvas
                entities={entities}
                relationships={relationships}
                selectedElement={selectedElement}
                zoom={zoom}
                onEntityMove={(id, x, y) => updateEntity(id, { x, y })}
                onRelationshipMove={(id, x, y) => updateRelationship(id, { x, y })}
                onAttributeMove={updateAttributePosition}
                onSelectElement={setSelectedElement}
                showAttributes={showAttributes}
              />
              
              {showRightSidebar && (
                <RightSidebar
                  selectedElement={selectedElement}
                  entities={entities}
                  onUpdateEntity={updateEntity}
                  onDeleteEntity={deleteEntity}
                />
              )}
            </>
          )}
          
          {viewMode === 'table' && (
            <div data-canvas className="flex-1 relative">
              <ReactFlow
                nodes={tableNodes as Node[]}
                edges={tableEdges}
                onNodesChange={onTableNodesChange}
                onEdgesChange={onTableEdgesChange}
                onConnect={onTableConnect}
                onInit={(instance) => {
                  tableFlowInstanceRef.current = instance;
                }}
                nodeTypes={tableNodeTypes}
                fitView
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          )}
        </div>

        <StatusBar
          entityCount={entities.length}
          relationshipCount={relationships.length}
          hasUnsavedChanges={hasUnsavedChanges}
          zoom={zoom}
          showSqlPreview={showSqlPreview}
          onToggleSqlPreview={toggleSqlPreview}
          hasSqlCode={!!sqlCode}
        />

        <SQLPreview 
          key={sqlCode} 
          sql={sqlCode} 
          isVisible={showSqlPreview}
          onClose={() => setShowSqlPreview(false)} 
          showSeparators={showSqlSeparators}
        />
        
        {showPromptModal && (
          <PromptModal
            onClose={() => setShowPromptModal(false)}
            onGenerate={(entities, rels, sql, prompt) => {
              setEntities(entities);
              setRelationships(rels);
              setSqlCode(sql);
              setCurrentPrompt(prompt || 'Generated Schema');
              setShowPromptModal(false);
              setHasUnsavedChanges(false);
            }}
          />
        )}
        
        {showExportModal && (
          <ExportModal
            entities={entities}
            relationships={relationships}
            sqlCode={sqlCode}
            onClose={() => setShowExportModal(false)}
            viewMode={viewMode}
          />
        )}
        
        {showTestModal && (
          <TestModal
            onClose={() => setShowTestModal(false)}
            onLoadSample={(sample) => {
              loadSampleDiagram(sample);
              // Delay closing to ensure state updates
              setTimeout(() => setShowTestModal(false), 0);
            }}
          />
        )}
        
        {showSavedSchemasModal && (
          <SavedSchemasModal
            onClose={() => setShowSavedSchemasModal(false)}
            onLoad={(entities, relationships, sql) => {
              setEntities(entities);
              setRelationships(relationships);
              setSqlCode(sql);
              setShowSavedSchemasModal(false);
              setHasUnsavedChanges(false);
            }}
          />
        )}
        
        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
          />
        )}
        
        {showAddEntityModal && (
          <AddEntityModal
            entities={entities}
            onClose={() => setShowAddEntityModal(false)}
            onAdd={(entityName, connectToEntityId, relationshipName, fromCardinality, toCardinality) => {
              addEntity(entityName, undefined, connectToEntityId, relationshipName, fromCardinality, toCardinality);
              setShowAddEntityModal(false);
            }}
          />
        )}
        
        {showAddRelationshipModal && (
          <AddRelationshipModal
            entities={entities}
            onClose={() => setShowAddRelationshipModal(false)}
            onAdd={(relationshipName, fromEntityId, toEntityId, fromCardinality, toCardinality) => {
              addRelationship(relationshipName, fromEntityId, toEntityId, fromCardinality, toCardinality);
              setShowAddRelationshipModal(false);
            }}
          />
        )}
        
        <Toaster />
    </div>
  );
}
