import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Play, Copy, Download } from 'lucide-react';
import { executeSQL } from '../services/api';
import { toast } from 'sonner';

type SQLExecutorProps = {
  onClose: () => void;
};

export function SQLExecutor({ onClose }: SQLExecutorProps) {
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);

  const handleExecute = async () => {
    if (!sql.trim()) {
      toast.error('Please enter SQL to execute');
      return;
    }

    setIsExecuting(true);
    try {
      const response = await executeSQL(sql);
      
      if (response.success && response.results) {
        setResults(response.results);
        
        // Extract columns from first result if it's a SELECT query
        if (response.results.length > 0 && response.results[0].columns) {
          setColumns(response.results[0].columns);
        } else {
          setColumns([]);
        }
        
        toast.success('SQL executed successfully');
      } else {
        toast.error('SQL execution failed');
        setResults([]);
        setColumns([]);
      }
    } catch (error: any) {
      console.error('SQL execution error:', error);
      toast.error(error.message || 'Failed to execute SQL');
      setResults([]);
      setColumns([]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    toast.success('SQL copied to clipboard');
  };

  const handleDownloadResults = () => {
    if (results.length === 0) {
      toast.error('No results to download');
      return;
    }

    let csvContent = '';
    
    if (columns.length > 0) {
      // CSV format for SELECT results
      csvContent = columns.join(',') + '\n';
      results.forEach(result => {
        if (result.rows) {
          result.rows.forEach((row: any[]) => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
          });
        }
      });
    } else {
      // Text format for other results
      csvContent = results.map(result => 
        result.message || JSON.stringify(result)
      ).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sql_results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results downloaded');
  };

  const renderResults = () => {
    if (results.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No results to display. Execute a query to see results here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">
              {result.type === 'SELECT' ? 'Query Results' : 'Execution Result'}
            </h4>
            
            {result.type === 'SELECT' && result.rows && result.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {columns.map((col, i) => (
                        <th key={i} className="border border-gray-300 px-3 py-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                            {cell === null ? <span className="text-gray-400">NULL</span> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm">{result.message || 'Operation completed successfully'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-[#7aa2f7]" />
            SQL Executor
          </DialogTitle>
          <DialogDescription>
            Execute custom SQL queries against the database. Use with caution as this can modify data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* SQL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">SQL Query:</label>
            <div className="relative">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="Enter your SQL query here...&#10;Example: SELECT * FROM users;"
                className="min-h-[120px] font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopySQL}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleExecute}
              disabled={isExecuting || !sql.trim()}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isExecuting ? 'Executing...' : 'Execute SQL'}
            </Button>
            
            {results.length > 0 && (
              <Button
                variant="outline"
                onClick={handleDownloadResults}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Results
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            <h3 className="text-lg font-medium mb-3">Results:</h3>
            {renderResults()}
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
