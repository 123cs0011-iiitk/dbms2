import { Download, FileCode, Image, FileJson } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import type { Entity, Relationship } from '../App';

type ExportModalProps = {
  entities: Entity[];
  relationships: Relationship[];
  sqlCode: string;
  onClose: () => void;
};

export function ExportModal({ entities, relationships, sqlCode, onClose }: ExportModalProps) {
  const handleExportSQL = () => {
    const blob = new Blob([sqlCode || '-- No SQL generated yet'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SQL file downloaded');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ entities, relationships }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON file downloaded');
  };

  const handleExportPNG = async () => {
    try {
      // Dynamically import html-to-image
      const { toPng } = await import('html-to-image');
      
      // Find the canvas element (you might need to adjust this selector)
      const canvasElement = document.querySelector('[data-canvas]') as HTMLElement;
      
      if (!canvasElement) {
        toast.error('Canvas element not found. Please try again.');
        return;
      }
      
      const dataUrl = await toPng(canvasElement, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        quality: 1
      });
      
      const link = document.createElement('a');
      link.download = 'er-diagram.png';
      link.href = dataUrl;
      link.click();
      
      toast.success('PNG exported successfully');
    } catch (error) {
      console.error('PNG export error:', error);
      toast.error('Failed to export PNG. Please try again.');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#7aa2f7]" />
            Export Diagram
          </DialogTitle>
          <DialogDescription>
            Choose the format you'd like to export your diagram in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleExportSQL}
          >
            <FileCode className="w-5 h-5 text-[#7aa2f7]" />
            <div className="text-left flex-1">
              <div>Export as SQL</div>
              <div className="text-xs text-gray-500">Download CREATE TABLE statements</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleExportJSON}
          >
            <FileJson className="w-5 h-5 text-[#9ece6a]" />
            <div className="text-left flex-1">
              <div>Export as JSON</div>
              <div className="text-xs text-gray-500">Save schema data structure</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleExportPNG}
          >
            <Image className="w-5 h-5 text-[#f7768e]" />
            <div className="text-left flex-1">
              <div>Export as PNG</div>
              <div className="text-xs text-gray-500">Download diagram as image</div>
            </div>
          </Button>
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
