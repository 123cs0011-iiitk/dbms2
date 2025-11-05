import { X, Plus, Trash2, Key, Link as LinkIcon, Settings, Database, Palette, Table } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import type { Entity, Attribute, SampleData } from '../App';
import { formatDisplayName } from '../utils/formatUtils';

type RightSidebarProps = {
  selectedElement: { type: 'entity' | 'relationship' | 'attribute'; id: string } | null;
  entities: Entity[];
  onUpdateEntity: (id: string, updates: Partial<Entity>) => void;
  onDeleteEntity: (id: string) => void;
};


export function RightSidebar({
  selectedElement,
  entities,
  onUpdateEntity,
  onDeleteEntity,
}: RightSidebarProps) {
  if (!selectedElement) {
    return (
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#16161e] flex flex-col items-center justify-center p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a table or relationship</p>
          <p className="text-xs mt-2 opacity-70">to edit its properties</p>
        </div>
      </div>
    );
  }

  if (selectedElement.type === 'entity') {
    const entity = entities.find(e => e.id === selectedElement.id);
    if (!entity) return null;

    const addAttribute = () => {
      const newAttr: Attribute = {
        id: `attr-${Date.now()}`,
        name: 'new_column',
        type: 'VARCHAR(255)',
        isNullable: true,
        x: 0,
        y: 0,
        entityId: entity.id,
      };
      onUpdateEntity(entity.id, {
        attributes: [...entity.attributes, newAttr],
      });
    };

    const updateAttribute = (attrId: string, updates: Partial<Attribute>) => {
      onUpdateEntity(entity.id, {
        attributes: entity.attributes.map(a =>
          a.id === attrId ? { ...a, ...updates } : a
        ),
      });
    };

    const deleteAttribute = (attrId: string) => {
      onUpdateEntity(entity.id, {
        attributes: entity.attributes.filter(a => a.id !== attrId),
      });
    };

    // Sample data management
    const sampleData = (entity as any).sampleData || [];
    
    const addSampleRow = () => {
      const newRow: SampleData = {
        id: `row-${Date.now()}`,
        values: entity.attributes.reduce((acc, attr) => {
          acc[attr.id] = '';
          return acc;
        }, {} as { [key: string]: string })
      };
      
      onUpdateEntity(entity.id, {
        sampleData: [...sampleData, newRow]
      });
    };

    const updateSampleValue = (rowId: string, attrId: string, value: string) => {
      const updatedData = sampleData.map((row: SampleData) => 
        row.id === rowId 
          ? { ...row, values: { ...row.values, [attrId]: value } }
          : row
      );
      
      onUpdateEntity(entity.id, {
        sampleData: updatedData
      });
    };

    const deleteSampleRow = (rowId: string) => {
      onUpdateEntity(entity.id, {
        sampleData: sampleData.filter((row: SampleData) => row.id !== rowId)
      });
    };

    const validateValue = (value: string, attr: Attribute): boolean => {
      if (!value.trim()) return true; // Allow empty values
      
      switch (attr.type) {
        case 'INTEGER':
        case 'BIGINT':
          return /^-?\d+$/.test(value);
        case 'DECIMAL(10,2)':
          return /^-?\d+(\.\d{1,2})?$/.test(value);
        case 'BOOLEAN':
          return ['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase());
        default:
          return true; // TEXT, VARCHAR, etc. accept any string
      }
    };

    return (
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#16161e] flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: entity.color + '30' }}>
                <Database className="w-4 h-4" style={{ color: entity.color }} />
              </div>
              <h3 className="font-semibold">Table Properties</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteEntity(entity.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <TabsList className="w-full rounded-none border-b border-gray-200 dark:border-gray-700 justify-start px-4 flex-shrink-0">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="fields" className="gap-2">
                <Database className="w-4 h-4" />
                Fields
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Table className="w-4 h-4" />
                Sample Data
              </TabsTrigger>
              <TabsTrigger value="style" className="gap-2">
                <Palette className="w-4 h-4" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="flex-1 mt-0 overflow-y-auto" style={{ minHeight: 0, flex: '1 1 0%', display: 'flex', flexDirection: 'column' }}>
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="entity-name">Table Name</Label>
                  <Input
                    id="entity-name"
                    value={entity.name}
                    onChange={(e) => onUpdateEntity(entity.id, { name: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="mt-0 p-0" style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden', padding: 0 }}>
              <div className="h-full flex flex-col" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <h4 className="font-medium text-sm">Columns ({entity.attributes.length})</h4>
                  <Button size="sm" onClick={addAttribute} className="gap-1 h-8">
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto" style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div className="p-4 space-y-3">
                {entity.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1b26] space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={attr.name}
                        onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                        className="flex-1 h-8 text-sm"
                        placeholder="Column name"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAttribute(attr.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Select value={attr.type} onValueChange={(value) => updateAttribute(attr.id, { type: value })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTEGER">INTEGER</SelectItem>
                        <SelectItem value="BIGINT">BIGINT</SelectItem>
                        <SelectItem value="VARCHAR(50)">VARCHAR(50)</SelectItem>
                        <SelectItem value="VARCHAR(100)">VARCHAR(100)</SelectItem>
                        <SelectItem value="VARCHAR(255)">VARCHAR(255)</SelectItem>
                        <SelectItem value="TEXT">TEXT</SelectItem>
                        <SelectItem value="DATE">DATE</SelectItem>
                        <SelectItem value="DATETIME">DATETIME</SelectItem>
                        <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                        <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                        <SelectItem value="DECIMAL(10,2)">DECIMAL(10,2)</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={attr.isPrimaryKey}
                          onCheckedChange={(checked) => updateAttribute(attr.id, { isPrimaryKey: checked })}
                          className="scale-75"
                        />
                        <Key className="w-3 h-3" />
                        <span>Primary Key</span>
                      </label>
                      
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={attr.isForeignKey}
                          onCheckedChange={(checked) => updateAttribute(attr.id, { isForeignKey: checked })}
                          className="scale-75"
                        />
                        <LinkIcon className="w-3 h-3" />
                        <span>Foreign Key</span>
                      </label>
                      
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={attr.isUnique}
                          onCheckedChange={(checked) => updateAttribute(attr.id, { isUnique: checked })}
                          className="scale-75"
                        />
                        <span>Unique</span>
                      </label>
                      
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={!attr.isNullable}
                          onCheckedChange={(checked) => updateAttribute(attr.id, { isNullable: !checked })}
                          className="scale-75"
                        />
                        <span>NOT NULL</span>
                      </label>
                    </div>
                  </div>
                ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 mt-0 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h4 className="font-medium text-sm">Sample Data ({sampleData.length} rows)</h4>
              <Button size="sm" onClick={addSampleRow} className="gap-1 h-8">
                <Plus className="w-3 h-3" />
                Add Row
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 space-y-3">
                {sampleData.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No sample data yet</p>
                    <p className="text-xs mt-2 opacity-70">Add rows to populate this table with sample data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium">
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${entity.attributes.length + 1}, 1fr)` }}>
                        {entity.attributes.map(attr => (
                          <div key={attr.id} className="truncate">
                            {formatDisplayName(attr.name)}
                            {attr.isPrimaryKey && <Key className="w-3 h-3 inline ml-1" />}
                          </div>
                        ))}
                        <div className="text-center">Actions</div>
                      </div>
                    </div>

                    {/* Data Rows */}
                    {sampleData.map((row: SampleData) => (
                      <div key={row.id} className="grid gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${entity.attributes.length + 1}, 1fr)` }}>
                          {entity.attributes.map(attr => (
                            <div key={attr.id}>
                              <Input
                                value={row.values[attr.id] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (validateValue(value, attr)) {
                                    updateSampleValue(row.id, attr.id, value);
                                  } else {
                                    toast.error(`Invalid value for ${attr.name}. Expected ${attr.type}`);
                                  }
                                }}
                                placeholder={`${attr.name} (${attr.type})`}
                                className="h-8 text-xs"
                              />
                            </div>
                          ))}
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSampleRow(row.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

            <TabsContent value="style" className="flex-1 mt-0 overflow-y-auto min-h-0">
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="entity-color">Table Color</Label>
                  <div className="flex gap-2 mt-2">
                    {['#7aa2f7', '#9ece6a', '#bb9af7', '#f7768e', '#7dcfff', '#e0af68'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateEntity(entity.id, { color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          entity.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (selectedElement.type === 'attribute') {
    // Find the attribute and its parent entity
    let selectedAttribute: Attribute | null = null;
    let parentEntity: Entity | null = null;
    
    for (const entity of entities) {
      const attr = entity.attributes?.find(a => a.id === selectedElement.id);
      if (attr) {
        selectedAttribute = attr;
        parentEntity = entity;
        break;
      }
    }
    
    if (!selectedAttribute || !parentEntity) return null;

    const updateAttribute = (updates: Partial<Attribute>) => {
      const updatedAttributes = parentEntity!.attributes?.map(attr => 
        attr.id === selectedAttribute!.id ? { ...attr, ...updates } : attr
      ) || [];
      onUpdateEntity(parentEntity!.id, { attributes: updatedAttributes });
    };

    const deleteAttribute = () => {
      const updatedAttributes = parentEntity!.attributes?.filter(attr => 
        attr.id !== selectedAttribute!.id
      ) || [];
      onUpdateEntity(parentEntity!.id, { attributes: updatedAttributes });
      toast.success('Attribute deleted');
    };

    return (
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#16161e] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attribute Properties</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteAttribute}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="attr-name">Attribute Name</Label>
              <Input
                id="attr-name"
                value={selectedAttribute.name}
                onChange={(e) => updateAttribute({ name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="attr-type">Data Type</Label>
              <Select
                value={selectedAttribute.type}
                onValueChange={(value) => updateAttribute({ type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTEGER">INTEGER</SelectItem>
                  <SelectItem value="VARCHAR(255)">VARCHAR(255)</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="DATE">DATE</SelectItem>
                  <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                  <SelectItem value="DECIMAL(10,2)">DECIMAL(10,2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="attr-pk">Primary Key</Label>
                <Switch
                  id="attr-pk"
                  checked={selectedAttribute.isPrimaryKey || false}
                  onCheckedChange={(checked) => updateAttribute({ isPrimaryKey: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="attr-fk">Foreign Key</Label>
                <Switch
                  id="attr-fk"
                  checked={selectedAttribute.isForeignKey || false}
                  onCheckedChange={(checked) => updateAttribute({ isForeignKey: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="attr-nullable">Nullable</Label>
                <Switch
                  id="attr-nullable"
                  checked={selectedAttribute.isNullable || false}
                  onCheckedChange={(checked) => updateAttribute({ isNullable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="attr-unique">Unique</Label>
                <Switch
                  id="attr-unique"
                  checked={selectedAttribute.isUnique || false}
                  onCheckedChange={(checked) => updateAttribute({ isUnique: checked })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Parent Entity:</strong> {parentEntity.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Drag the attribute to reposition it around the entity
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Relationship editing would go here
  return null;
}
