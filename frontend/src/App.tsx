import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { TableCanvas } from './components/TableCanvas';
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
import { Toaster } from './components/ui/sonner';
import { saveSchema, resetDatabase } from './services/api';
import { frontendToBackend } from './utils/schemaTransform';
import { calculateTreeLayout } from './utils/treeLayout';
import { toast } from 'sonner';
import { entitiesToTables, tablesToEntities, TableNode as TableNodeType } from './utils/modeConversion';
import { Edge } from 'reactflow';

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
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showAttributes, setShowAttributes] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showSqlSeparators, setShowSqlSeparators] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [zoom, setZoom] = useState(100);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

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

  // Handle view mode changes and data conversion
  useEffect(() => {
    if (viewMode === 'table' && entities.length > 0) {
      // Convert entities to tables when switching to table mode
      const { nodes, edges } = entitiesToTables(entities, relationships);
      setTableNodes(nodes);
      setTableEdges(edges);
    } else if (viewMode === 'er-diagram' && tableNodes.length > 0) {
      // Convert tables to entities when switching to ER diagram mode
      const { entities: convertedEntities, relationships: convertedRelationships } = 
        tablesToEntities(tableNodes, tableEdges);
      setEntities(convertedEntities);
      setRelationships(convertedRelationships);
      
      // Trigger auto-layout immediately after state update
      setTimeout(() => {
        if (convertedEntities.length > 0) {
          // Calculate viewport center
          const viewportCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          };
          const centerX = viewportCenter.x;
          const centerY = viewportCenter.y;
          
          // Position entities in circular layout
          let radius;
          if (convertedEntities.length === 1) {
            radius = 0;
          } else if (convertedEntities.length === 2) {
            radius = 200;
          } else if (convertedEntities.length <= 4) {
            radius = 300;
          } else if (convertedEntities.length <= 8) {
            radius = 350;
          } else {
            radius = 400;
          }
          
          const layoutEntities = convertedEntities.map((entity, index) => {
            let x, y;
            if (convertedEntities.length === 1) {
              x = centerX;
              y = centerY;
            } else if (convertedEntities.length === 2) {
              x = centerX + (index === 0 ? -radius : radius);
              y = centerY;
            } else {
              const angle = (index * (360 / convertedEntities.length)) * (Math.PI / 180);
              x = centerX + Math.cos(angle) * radius;
              y = centerY + Math.sin(angle) * radius;
            }
            return { ...entity, x, y };
          });
          
          setEntities(layoutEntities);
        }
      }, 50);
    }
  }, [viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setHasUnsavedChanges(true);
  };

  const addEntity = (name: string = 'Entity', attributes?: Attribute[]) => {
    const newEntity: Entity = {
      id: `entity-${Date.now()}`,
      name,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      color: '#7aa2f7',
      attributes: attributes || [
        {
          id: `attr-${Date.now()}`,
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
        },
        {
          id: `attr-${Date.now()}-1`,
          name: 'name',
          type: 'VARCHAR(100)',
          isNullable: false,
        },
      ],
    };
    setEntities([...entities, newEntity]);
    setHasUnsavedChanges(true);
  };

  const addRelationship = () => {
    if (entities.length < 2) {
      alert('You need at least 2 entities to create a relationship');
      return;
    }
    
    const newRelationship: Relationship = {
      id: `rel-${Date.now()}`,
      name: 'Relates',
      x: 400,
      y: 300,
      fromEntityId: entities[0].id,
      toEntityId: entities[entities.length - 1].id,
      cardinality: '1:N',
      fromCardinality: '1',
      toCardinality: 'N',
    };
    setRelationships([...relationships, newRelationship]);
    setHasUnsavedChanges(true);
  };

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    const updatedEntities = entities.map(e => e.id === id ? { ...e, ...updates } : e);
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

  const generateSQL = useCallback(() => {
    let sql = '-- Generated SQL DDL\n\n';
    
    entities.forEach(entity => {
      sql += `CREATE TABLE ${entity.name} (\n`;
      entity.attributes.forEach((attr, idx) => {
        sql += `  ${attr.name} ${attr.type}`;
        if (attr.isPrimaryKey) sql += ' PRIMARY KEY';
        if (attr.isUnique && !attr.isPrimaryKey) sql += ' UNIQUE';
        if (!attr.isNullable && !attr.isPrimaryKey) sql += ' NOT NULL';
        if (idx < entity.attributes.length - 1) sql += ',';
        sql += '\n';
      });
      
      const fkAttributes = entity.attributes.filter(a => a.isForeignKey);
      if (fkAttributes.length > 0) {
        fkAttributes.forEach(fk => {
          sql += `,\n  FOREIGN KEY (${fk.name}) REFERENCES RefTable(id)`;
        });
        sql += '\n';
      }
      
      sql += ');\n\n';
      
      // Add sample data if available
      const sampleData = (entity as any).sampleData || [];
      if (sampleData.length > 0) {
        sql += `-- Sample data for ${entity.name}\n`;
        sampleData.forEach((row: any) => {
          const columnNames = entity.attributes.map(attr => attr.name);
          const values = columnNames.map(name => {
            const value = row.values[entity.attributes.find(attr => attr.name === name)?.id || ''];
            if (value === null || value === undefined || value === '') {
              return 'NULL';
            }
            // Escape single quotes and wrap in quotes
            return `'${String(value).replace(/'/g, "''")}'`;
          });
          
          sql += `INSERT INTO ${entity.name} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        });
        sql += '\n';
      }
    });
    
    setSqlCode(sql);
  }, [entities]);

  // SQL Preview toggle handler - generates SQL if it doesn't exist
  const toggleSqlPreview = useCallback(() => {
    // If no SQL exists yet, generate it first
    if (!sqlCode && entities.length > 0) {
      generateSQL();
      setShowSqlPreview(true);
    } else {
      setShowSqlPreview(prev => !prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqlCode, entities]);

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
    
    // Use sequential compact layout (same as initial import)
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
    // Auto-show SQL preview if sample has SQL
    if (sample.sql) {
      setShowSqlPreview(true);
    }
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
    <div className={isDarkMode ? 'dark' : ''}>
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
                onAddEntity={addEntity}
                onAddRelationship={addRelationship}
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
                onToggleAttributes={() => setShowAttributes(!showAttributes)}
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
            <TableCanvas
              nodes={tableNodes}
              edges={tableEdges}
              onNodesChange={setTableNodes}
              onEdgesChange={setTableEdges}
              zoom={zoom}
            />
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
              // Auto-show SQL preview when generated from AI
              if (sql) {
                setShowSqlPreview(true);
              }
            }}
          />
        )}
        
        {showExportModal && (
          <ExportModal
            entities={entities}
            relationships={relationships}
            sqlCode={sqlCode}
            onClose={() => setShowExportModal(false)}
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
              // Auto-show SQL preview if loaded schema has SQL
              if (sql) {
                setShowSqlPreview(true);
              }
            }}
          />
        )}
        
        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
          />
        )}
        
        <Toaster />
      </div>
    </div>
  );
}
