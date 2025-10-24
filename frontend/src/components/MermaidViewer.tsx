import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Entity, Relationship } from '../App';

type MermaidViewerProps = {
  entities: Entity[];
  relationships: Relationship[];
  onClose: () => void;
};

export function MermaidViewer({ entities, relationships, onClose }: MermaidViewerProps) {
  const [mermaidCode, setMermaidCode] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const generateMermaidCode = () => {
    if (entities.length === 0) {
      return 'erDiagram\n  No tables found';
    }

    let code = 'erDiagram\n';
    
    // Add entities
    entities.forEach(entity => {
      const tableName = entity.name.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `  ${tableName} {\n`;
      
      entity.attributes.forEach(attr => {
        const type = attr.type.replace(/\(.*?\)/, '');
        const key = attr.isPrimaryKey ? ' PK' : attr.isForeignKey ? ' FK' : '';
        const nullable = attr.isNullable ? '' : ' NOT NULL';
        code += `    ${type} ${attr.name}${key}${nullable}\n`;
      });
      
      code += `  }\n`;
    });

    // Add relationships
    relationships.forEach(rel => {
      const fromEntity = entities.find(e => e.id === rel.fromEntityId);
      const toEntity = entities.find(e => e.id === rel.toEntityId);
      
      if (fromEntity && toEntity) {
        const fromName = fromEntity.name.replace(/[^a-zA-Z0-9_]/g, '_');
        const toName = toEntity.name.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Determine cardinality based on relationship type
        let cardinality = '||--o{'; // Default one-to-many
        if (rel.cardinality === '1:1') {
          cardinality = '||--||';
        } else if (rel.cardinality === 'N:N') {
          cardinality = '}o--o{';
        }
        
        code += `  ${fromName} ${cardinality} ${toName} : "${rel.name}"\n`;
      }
    });

    return code;
  };

  const renderMermaidDiagram = async () => {
    if (!mermaidRef.current) return;
    
    setIsRendering(true);
    try {
      const code = generateMermaidCode();
      setMermaidCode(code);
      
      // Clear previous diagram
      mermaidRef.current.innerHTML = '';
      mermaidRef.current.removeAttribute('data-processed');
      
      // Dynamically import mermaid
      const mermaid = (await import('mermaid')).default;
      
      // Initialize mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        er: {
          fontSize: 12
        },
        securityLevel: 'loose'
      });
      
      // Generate unique ID for this diagram
      const diagramId = `mermaid-erd-${Date.now()}`;
      
      // Render new diagram
      const { svg } = await mermaid.render(diagramId, code);
      mermaidRef.current.innerHTML = svg;
      
      toast.success('Diagram rendered successfully');
    } catch (err: any) {
      console.error('Failed to render Mermaid diagram:', err);
      toast.error('Failed to render diagram');
      
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center;">
            <h4>Failed to render diagram</h4>
            <p>Error: ${err.message}</p>
            <details style="margin-top: 10px;">
              <summary>Mermaid Code:</summary>
              <pre style="background: #f5f5f5; padding: 10px; margin: 10px 0; text-align: left; overflow-x: auto;">${generateMermaidCode()}</pre>
            </details>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    toast.success('Mermaid code copied to clipboard');
  };

  const handleDownloadCode = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Mermaid file downloaded');
  };

  // Auto-render on open
  useEffect(() => {
    if (entities.length > 0) {
      renderMermaidDiagram();
    }
  }, [entities, relationships]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#bb9af7]" />
            Mermaid ER Diagram
          </DialogTitle>
          <DialogDescription>
            Visual Entity Relationship diagram generated from your schema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={renderMermaidDiagram}
              disabled={isRendering || entities.length === 0}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
              {isRendering ? 'Rendering...' : 'Refresh Diagram'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCopyCode}
              disabled={!mermaidCode}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadCode}
              disabled={!mermaidCode}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* Visual Diagram */}
          <div className="flex-1 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="text-sm font-medium mb-2">Visual Diagram:</h4>
            <div 
              ref={mermaidRef} 
              className="flex justify-center items-center min-h-[300px] overflow-auto"
            />
            {entities.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No entities found. Create some entities to see the ER diagram.</p>
              </div>
            )}
          </div>

          {/* Mermaid Code */}
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Mermaid Code:</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto max-h-40">
              {mermaidCode || '// Generate diagram to see code here'}
            </pre>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
