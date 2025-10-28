import { useMemo, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode';
import { TableNode as TableNodeType } from '../utils/modeConversion';

type TableCanvasProps = {
  nodes: TableNodeType[];
  edges: Edge[];
  onNodesChange: (nodes: TableNodeType[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  zoom?: number; // Optional - kept for API compatibility but not used
};

export function TableCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: TableCanvasProps) {
  // Callbacks for TableNode actions
  const handleAddColumn = useCallback(
    (nodeId: string, colName: string, colType: string = 'TEXT') => {
      const updatedNodes = nodes.map((n) =>
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
      );
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleRenameTable = useCallback(
    (nodeId: string, name: string) => {
      const updatedNodes = nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, tableName: name } } : n
      );
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleRenameColumn = useCallback(
    (nodeId: string, idx: number, newName: string) => {
      const updatedNodes = nodes.map((n) =>
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
      );
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleChangeColumnType = useCallback(
    (nodeId: string, idx: number, newType: string) => {
      const updatedNodes = nodes.map((n) =>
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
      );
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleRemoveColumn = useCallback(
    (nodeId: string, idx: number) => {
      const updatedNodes = nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const colName = n.data.columns[idx]?.name;
        const nextCols = n.data.columns.filter((_, i) => i !== idx);
        const nextVals = n.data.values.filter((_, i) => i !== idx);
        const nextPK = n.data.primaryKey === colName ? '' : n.data.primaryKey;
        return {
          ...n,
          data: { ...n.data, columns: nextCols, values: nextVals, primaryKey: nextPK },
        };
      });
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleAddRow = useCallback(
    (nodeId: string, rowValues: string[]) => {
      const updatedNodes = nodes.map((n) => {
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
      });
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleUpdateCell = useCallback(
    (nodeId: string, rowIdx: number, colIdx: number, value: string) => {
      const updatedNodes = nodes.map((n) => {
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
      });
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleRemoveRow = useCallback(
    (nodeId: string, rowIdx: number) => {
      const updatedNodes = nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const nextValues = n.data.values.map((colValues) => colValues.filter((_, i) => i !== rowIdx));
        return { ...n, data: { ...n.data, values: nextValues } };
      });
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleSetPrimaryKey = useCallback(
    (nodeId: string, colName: string) => {
      const updatedNodes = nodes.map((n) => {
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
      });
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const handleDeleteTable = useCallback(
    (nodeId: string) => {
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      onNodesChange(updatedNodes);
      onEdgesChange(updatedEdges);
    },
    [nodes, edges, onNodesChange, onEdgesChange]
  );

  // React Flow node types
  const nodeTypes = useMemo(() => {
    return {
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
    };
  }, [
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

  const onReactFlowNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes as Node[]) as TableNodeType[];
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  const onReactFlowEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = { ...params, animated: true, type: 'smoothstep' };
      const updatedEdges = addEdge(edge, edges);
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );

  return (
    <div data-canvas className="flex-1 relative">
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edges}
        onNodesChange={onReactFlowNodesChange}
        onEdgesChange={onReactFlowEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

