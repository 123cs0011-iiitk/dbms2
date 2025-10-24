import React, { useState, useEffect } from 'react';
import { Save, Clock, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { getSavedSchemas, deleteSchema, type SavedSchema } from '../services/api';
import { parseSavedSchema } from '../utils/schemaTransform';
import type { Entity, Relationship } from '../App';

type SavedSchemasModalProps = {
  onClose: () => void;
  onLoad: (entities: Entity[], relationships: Relationship[], sql: string) => void;
};

export function SavedSchemasModal({ onClose, onLoad }: SavedSchemasModalProps) {
  const [schemas, setSchemas] = useState<SavedSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch saved schemas on component mount
  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const result = await getSavedSchemas();
        if (result.success) {
          setSchemas(result.schemas);
        } else {
          toast.error('Failed to load saved schemas');
        }
      } catch (error: any) {
        console.error('Error fetching schemas:', error);
        toast.error(error.message || 'Failed to load saved schemas');
      } finally {
        setLoading(false);
      }
    };

    fetchSchemas();
  }, []);

  const handleLoadSchema = async (schema: SavedSchema) => {
    try {
      // Parse the schema data and transform to frontend format (now async with AI layout)
      const { entities, relationships } = await parseSavedSchema(schema.schema_data);
      
      if (entities.length === 0) {
        toast.error('This schema appears to be empty or corrupted');
        return;
      }

      onLoad(entities, relationships, schema.sql_code);
      onClose();
      toast.success('Schema loaded successfully!');
    } catch (error) {
      console.error('Error loading schema:', error);
      toast.error('Failed to load schema');
    }
  };

  const handleDeleteSchema = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schema?')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteSchema(id);
      if (result.success) {
        setSchemas(schemas.filter(s => s.id !== id));
        toast.success('Schema deleted successfully');
      } else {
        toast.error('Failed to delete schema');
      }
    } catch (error: any) {
      console.error('Error deleting schema:', error);
      toast.error(error.message || 'Failed to delete schema');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-[#ea580c]" />
            Saved Schemas
          </DialogTitle>
          <DialogDescription>
            Load previously saved database schemas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Loader2 className="w-8 h-8 text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading saved schemas...</p>
            </div>
          ) : schemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Save className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No saved schemas yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Your saved schemas will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemas.map((schema) => {
                // Parse schema to get entity/relationship counts (simple JSON parse, no layout)
                let entityCount = 0;
                let relationshipCount = 0;
                try {
                  const schemaData = JSON.parse(schema.schema_data);
                  entityCount = schemaData.tables?.length || 0;
                  relationshipCount = schemaData.relationships?.length || 0;
                } catch (error) {
                  console.error('Error parsing schema for display:', error);
                }

                return (
                  <div
                    key={schema.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-[#1a1b26]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {schema.prompt.length > 60 
                            ? `${schema.prompt.substring(0, 60)}...` 
                            : schema.prompt
                          }
                        </h3>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(schema.created_at)}</span>
                          </div>
                          <span>{entityCount} tables</span>
                          <span>{relationshipCount} relationships</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadSchema(schema)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleDeleteSchema(schema.id)}
                          disabled={deletingId === schema.id}
                        >
                          {deletingId === schema.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
