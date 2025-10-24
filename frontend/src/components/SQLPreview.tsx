import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

type SQLPreviewProps = {
  sql: string;
  onClose: () => void;
  showSeparators: boolean;
};

export function SQLPreview({ sql, onClose, showSeparators }: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse SQL into blocks (CREATE TABLE statements)
  const parseSqlBlocks = () => {
    if (!showSeparators) {
      return [{ content: sql, type: 'full' }];
    }

    const blocks: { content: string; type: string }[] = [];
    const lines = sql.split('\n');
    let currentBlock: string[] = [];
    let inCreateTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this is the start of a CREATE TABLE statement
      if (trimmedLine.toUpperCase().startsWith('CREATE TABLE')) {
        // If we have a previous block, save it
        if (currentBlock.length > 0) {
          blocks.push({ content: currentBlock.join('\n'), type: 'table' });
          currentBlock = [];
        }
        inCreateTable = true;
        currentBlock.push(line);
      } else if (inCreateTable) {
        currentBlock.push(line);
        // Check if this line ends the CREATE TABLE (ends with );)
        if (trimmedLine.endsWith(');')) {
          inCreateTable = false;
          // Continue to collect INSERT statements and comments that follow
        } else if (trimmedLine === '' && !inCreateTable && currentBlock.length > 0) {
          // Empty line after CREATE TABLE block - might be end of this section
          // Check next non-empty line
          let foundNext = false;
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine !== '') {
              if (nextLine.toUpperCase().startsWith('CREATE TABLE')) {
                // Next block is starting, save current
                blocks.push({ content: currentBlock.join('\n'), type: 'table' });
                currentBlock = [];
                foundNext = true;
              }
              break;
            }
          }
          if (!foundNext) {
            currentBlock.push(line);
          }
        }
      } else {
        currentBlock.push(line);
      }
    }

    // Add the last block
    if (currentBlock.length > 0) {
      blocks.push({ content: currentBlock.join('\n'), type: 'table' });
    }

    return blocks.length > 0 ? blocks : [{ content: sql, type: 'full' }];
  };

  const sqlBlocks = parseSqlBlocks();

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
        <div className="p-4">
          {sqlBlocks.map((block, index) => (
            <div key={index}>
              <pre className="text-sm font-mono">
                <code className="text-gray-800 dark:text-gray-200">{block.content}</code>
              </pre>
              {showSeparators && index < sqlBlocks.length - 1 && (
                <div className="my-4 border-t-2 border-gray-300 dark:border-gray-600" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
