import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

type SQLPreviewProps = {
  sql: string;
  onClose: () => void;
};

export function SQLPreview({ sql, onClose }: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1b26] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">SQL Preview</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm font-mono">
          <code className="text-gray-800 dark:text-gray-200">{sql}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
