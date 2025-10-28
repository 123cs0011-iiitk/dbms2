import { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { formatDisplayName } from "../utils/formatUtils";

type TableColumn = {
  name: string;
  type: string;
};

type TableNodeProps = {
  id: string;
  data: {
    tableName: string;
    columns: TableColumn[];
    values: string[][];
    primaryKey?: string;
    primaryKeys?: string[];
    foreignKeys?: {
      column: string;
      referencesTable?: string;
      referencesColumn?: string;
      refTableId?: string;
      refColumn?: string;
    }[];
  };
  onAddColumn?: (nodeId: string, colName: string, colType?: string) => void;
  onRenameTable?: (nodeId: string, name: string) => void;
  onRenameColumn?: (nodeId: string, idx: number, newName: string) => void;
  onChangeColumnType?: (nodeId: string, idx: number, newType: string) => void;
  onRemoveColumn?: (nodeId: string, idx: number) => void;
  onAddRow?: (nodeId: string, rowValues: string[]) => void;
  onSetPrimaryKey?: (nodeId: string, colName: string) => void;
  onUpdateCell?: (nodeId: string, rowIdx: number, colIdx: number, value: string) => void;
  onRemoveRow?: (nodeId: string, rowIdx: number) => void;
  onDeleteTable?: (nodeId: string) => void;
};

// Color palettes matching ER Diagram entity colors
const COLOR_PALETTES = [
  { 
    header: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)", // blue-400 to blue-600
    headerLight: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    border: "rgba(59,130,246,0.2)",
    borderStrong: "rgba(59,130,246,0.4)",
    shadow: "rgba(59,130,246,0.15)"
  },
  { 
    header: "linear-gradient(135deg, #4ade80 0%, #16a34a 100%)", // green-400 to green-600
    headerLight: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    border: "rgba(34,197,94,0.2)",
    borderStrong: "rgba(34,197,94,0.4)",
    shadow: "rgba(34,197,94,0.15)"
  },
  { 
    header: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)", // purple-400 to purple-600
    headerLight: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    border: "rgba(147,51,234,0.2)",
    borderStrong: "rgba(147,51,234,0.4)",
    shadow: "rgba(147,51,234,0.15)"
  },
  { 
    header: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)", // pink-400 to pink-600
    headerLight: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    border: "rgba(236,72,153,0.2)",
    borderStrong: "rgba(236,72,153,0.4)",
    shadow: "rgba(236,72,153,0.15)"
  },
  { 
    header: "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)", // cyan-400 to cyan-600
    headerLight: "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)",
    border: "rgba(6,182,212,0.2)",
    borderStrong: "rgba(6,182,212,0.4)",
    shadow: "rgba(6,182,212,0.15)"
  },
  { 
    header: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)", // amber-400 to amber-600
    headerLight: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    border: "rgba(245,158,11,0.2)",
    borderStrong: "rgba(245,158,11,0.4)",
    shadow: "rgba(245,158,11,0.15)"
  },
];

// Hash function to get stable color based on table name
const getTableColor = (tableName: string) => {
  let hash = 0;
  for (let i = 0; i < tableName.length; i++) {
    hash = ((hash << 5) - hash) + tableName.charCodeAt(i);
    hash = hash & hash;
  }
  return COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
};

export function TableNode({
  id,
  data,
  onAddColumn,
  onRenameTable,
  onRenameColumn,
  onChangeColumnType,
  onRemoveColumn,
  onAddRow,
  onSetPrimaryKey,
  onUpdateCell,
  onRemoveRow,
  onDeleteTable,
}: TableNodeProps) {
  const [newCol, setNewCol] = useState("");
  const [newRowValues, setNewRowValues] = useState<string[]>(Array(data.columns.length).fill(""));
  const [error, setError] = useState("");
  
  // Get unique color for this table
  const colorScheme = getTableColor(data.tableName);

  // Keep input row length in sync with column count
  useEffect(() => {
    if (newRowValues.length !== data.columns.length) {
      const next = Array(data.columns.length).fill("");
      for (let i = 0; i < Math.min(newRowValues.length, next.length); i++) {
        next[i] = newRowValues[i];
      }
      setNewRowValues(next);
    }
  }, [data.columns.length, newRowValues.length]);

  const addColumn = () => {
    if (!newCol.trim() || !onAddColumn) return;
    onAddColumn(id, newCol.trim(), "TEXT");
    setNewCol("");
  };

  const handleRowInputChange = (colIndex: number, value: string) => {
    const updated = [...newRowValues];
    updated[colIndex] = value;
    setNewRowValues(updated);
  };

  const addRow = () => {
    if (!onAddRow) return;

    // Local PK validation for immediate feedback
    const primaryKeys = data.primaryKeys || [];
    if (primaryKeys.length > 0) {
      // Check if all primary key columns have values
      for (const pkCol of primaryKeys) {
        const pkIndex = data.columns.map((c) => c.name).indexOf(pkCol);
        if (pkIndex >= 0) {
          const pkVal = (newRowValues[pkIndex] ?? "").trim();
          if (pkVal === "") {
            setError(`Primary key '${pkCol}' cannot be empty.`);
            return;
          }
        }
      }

      // Check for duplicate composite primary key
      const pkValues = primaryKeys.map((pkCol) => {
        const pkIndex = data.columns.map((c) => c.name).indexOf(pkCol);
        return pkIndex >= 0 ? (newRowValues[pkIndex] ?? "").trim() : "";
      });

      // Check against existing rows
      for (let i = 0; i < (data.values[0] || []).length; i++) {
        const existingPkValues = primaryKeys.map((pkCol) => {
          const pkIndex = data.columns.map((c) => c.name).indexOf(pkCol);
          return pkIndex >= 0 ? String((data.values[pkIndex] || [])[i] || "").trim() : "";
        });

        if (JSON.stringify(pkValues) === JSON.stringify(existingPkValues)) {
          setError(`Duplicate composite primary key: ${primaryKeys.join(", ")}`);
          return;
        }
      }
    }
    setError("");
    // Send entire row to parent for PK validation and insertion
    onAddRow(id, newRowValues);
    // Clear inputs for continuous entry
    setNewRowValues(Array(data.columns.length).fill(""));
  };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        minWidth: Math.max(280, data.columns.length * 100),
        maxWidth: 600,
        background: "#ffffff",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        boxShadow: `0 4px 6px -1px rgba(0,0,0,0.1), 0 10px 15px -3px ${colorScheme.shadow}, 0 0 0 1px ${colorScheme.border}`,
      }}
    >
      {/* Table Name Header - Prominent Gradient */}
      <div 
        className="cursor-move flex items-center justify-between relative overflow-hidden"
        style={{
          background: colorScheme.header,
          padding: "px-6 py-4",
          boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <input
          value={data.tableName}
          onChange={(e) => onRenameTable && onRenameTable(id, e.target.value)}
          className="nodrag flex-1 text-center bg-transparent border-none outline-none"
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#fff",
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            cursor: "text",
            padding: "16px 24px",
          }}
        />
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete the table '${data.tableName}'?`)) {
              onDeleteTable && onDeleteTable(id);
            }
          }}
          className="nodrag text-white border-none cursor-pointer rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 mr-4"
          style={{
            background: "rgba(239,68,68,0.8)",
            padding: "8px 12px",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title="Delete table"
        >
          ×
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Primary Key selection - Improved */}
        {data.columns.length > 0 && (
          <div 
            className="rounded-lg"
            style={{
              background: colorScheme.headerLight,
              border: `2px solid ${colorScheme.border}`,
              padding: "12px 16px",
              marginBottom: 12,
              boxShadow: `0 2px 4px ${colorScheme.shadow}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: "#1f2937", fontSize: 13 }}>Primary Key:</span>
              {data.columns.map((col, idx) => (
                <label 
                  key={idx} 
                  className="nodrag cursor-pointer transition-all duration-200 hover:scale-105" 
                  style={{ fontSize: 13, color: "#1f2937" }}
                >
                  <input
                    type="checkbox"
                    checked={data.primaryKeys && data.primaryKeys.includes(col.name)}
                    onChange={() => onSetPrimaryKey && onSetPrimaryKey(id, col.name)}
                    className="nodrag mr-2"
                    style={{ cursor: "pointer", transform: "scale(1.2)" }}
                  />
                  {formatDisplayName(col.name)}
                </label>
              ))}
              {data.primaryKeys && data.primaryKeys.length > 1 && (
                <span 
                  className="px-2 py-1 rounded-full"
                  style={{ 
                    fontSize: 11, 
                    background: colorScheme.header,
                    color: "#fff",
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Composite Key
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 12,
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Table Grid - Polished */}
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, marginBottom: 12 }}>
          <thead>
            <tr>
              {data.columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    border: `2px solid ${colorScheme.border}`,
                    padding: "12px 8px",
                    background: colorScheme.header,
                    color: "#fff",
                    minWidth: "100px",
                    maxWidth: "180px",
                    fontWeight: 600,
                    fontSize: 13,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        value={col.name}
                        onChange={(e) => onRenameColumn && onRenameColumn(id, idx, e.target.value)}
                        className="nodrag flex-1 border-none text-center outline-none transition-all duration-200"
                        style={{
                          fontSize: 13,
                          background: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontWeight: 700,
                          padding: "4px 6px",
                          borderRadius: 4,
                          cursor: "text",
                        }}
                        onFocus={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.3)";
                        }}
                        onBlur={(e) => {
                          e.target.style.background = "rgba(255,255,255,0.2)";
                        }}
                      />
                      <button
                        onClick={() => onRemoveColumn && onRemoveColumn(id, idx)}
                        className="nodrag text-white hover:text-red-200 transition-all duration-200 hover:scale-110"
                        style={{ fontSize: 14, padding: "4px 8px" }}
                      >
                        ×
                      </button>
                    </div>
                    <select
                      value={col.type}
                      onChange={(e) => onChangeColumnType && onChangeColumnType(id, idx, e.target.value)}
                      className="nodrag rounded border-none outline-none transition-all duration-200"
                      style={{ 
                        fontSize: 11, 
                        width: "100%",
                        background: "rgba(255,255,255,0.3)",
                        color: "#fff",
                        cursor: "pointer",
                        padding: "4px 6px",
                      }}
                    >
                      <option style={{ color: "#000" }}>TEXT</option>
                      <option style={{ color: "#000" }}>INTEGER</option>
                      <option style={{ color: "#000" }}>REAL</option>
                      <option style={{ color: "#000" }}>BOOLEAN</option>
                      <option style={{ color: "#000" }}>VARCHAR(100)</option>
                      <option style={{ color: "#000" }}>DATE</option>
                    </select>
                  </div>
                  {/* Per-column connection handles */}
                  <div style={{ position: "relative", height: 0 }}>
                    <Handle id={`${id}:${col.name}:target`} type="target" position={Position.Left} style={{ top: 12 }} />
                    <Handle id={`${id}:${col.name}:source`} type="source" position={Position.Right} style={{ top: 12 }} />
                  </div>
                </th>
              ))}
              {/* Extra header for delete button column */}
              {data.values?.[0]?.length > 0 && (
                <th 
                  style={{ 
                    border: `2px solid ${colorScheme.border}`,
                    background: colorScheme.header,
                    minWidth: "100px",
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {data.columns.length === 0 ? (
              <tr>
                <td 
                  colSpan={data.columns.length || 1}
                  style={{ 
                    textAlign: "center", 
                    padding: "24px",
                    color: "#9ca3af",
                    fontSize: 13
                  }}
                >
                  Add a column to start entering rows.
                </td>
              </tr>
            ) : data.values && data.values[0] && data.values[0].length > 0 ? (
              Array.from({ length: data.values[0].length }).map((_, rowIdx) => (
                <tr key={rowIdx} className="transition-all duration-200 hover:bg-teal-50">
                  {data.columns.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        border: `1px solid ${colorScheme.border}`,
                        padding: "10px 12px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "#1f2937",
                        background: rowIdx % 2 === 0 ? "#f9fafb" : "#ffffff",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        value={data.values[colIdx]?.[rowIdx] ?? ""}
                        onChange={(e) => onUpdateCell && onUpdateCell(id, rowIdx, colIdx, e.target.value)}
                        className="nodrag w-full border-none text-center bg-transparent outline-none transition-all duration-200"
                        style={{ 
                          fontSize: 13,
                          color: "#1f2937"
                        }}
                        onFocus={(e) => {
                          e.target.style.background = "#f3f4f6";
                          e.target.style.outline = `2px solid ${colorScheme.borderStrong}`;
                          e.target.style.borderRadius = "4px";
                        }}
                        onBlur={(e) => {
                          e.target.style.background = "transparent";
                          e.target.style.outline = "none";
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ border: `1px solid ${colorScheme.border}`, padding: 0 }}>
                    <button
                      onClick={() => onRemoveRow && onRemoveRow(id, rowIdx)}
                      className="nodrag text-white hover:bg-red-700 rounded transition-all duration-200 active:scale-95"
                      style={{ 
                        fontSize: 13, 
                        background: "#ef4444",
                        cursor: "pointer",
                        fontWeight: 600,
                        width: "100%",
                        padding: "10px",
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : null}
            {/* Row for adding new values */}
            {data.columns.length > 0 && (
              <tr>
                {data.columns.map((col, colIdx) => (
                  <td 
                    key={colIdx} 
                    style={{ 
                      border: `1px solid ${colorScheme.border}`,
                      padding: 0,
                      background: "#f0fdfa"
                    }}
                  >
                    <input
                      value={newRowValues[colIdx]}
                      placeholder={col.name}
                      onChange={(e) => handleRowInputChange(colIdx, e.target.value)}
                      className="nodrag w-full border-none px-3 py-2 bg-transparent outline-none transition-all duration-200"
                      style={{
                        fontSize: 13,
                        boxSizing: "border-box",
                        color: "#1f2937",
                      }}
                      placeholder="#9ca3af"
                      onFocus={(e) => {
                        e.target.style.background = "#ffffff";
                        e.target.style.outline = `2px solid ${colorScheme.borderStrong}`;
                        e.target.style.borderRadius = "4px";
                      }}
                      onBlur={(e) => {
                        e.target.style.background = "#f0fdfa";
                        e.target.style.outline = "none";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                    />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>

        {/* Add Column and Add Row Buttons - Enhanced */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 8 }}>
          <div style={{ display: "flex", flex: 1, gap: 8 }}>
            <input
              type="text"
              value={newCol}
              placeholder="Add column"
              onChange={(e) => setNewCol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addColumn();
              }}
              className="nodrag flex-1 text-sm rounded-lg outline-none transition-all duration-200 focus:scale-105"
              style={{ 
                fontSize: 13,
                padding: "10px 12px",
                border: `2px solid ${colorScheme.border}`,
                boxShadow: `0 2px 4px ${colorScheme.shadow}`
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colorScheme.borderStrong;
                e.target.style.boxShadow = `0 0 0 3px ${colorScheme.shadow}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colorScheme.border;
                e.target.style.boxShadow = `0 2px 4px ${colorScheme.shadow}`;
              }}
            />
            <button
              onClick={addColumn}
              style={{
                background: colorScheme.header,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                padding: "10px 16px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                boxShadow: `0 4px 6px ${colorScheme.shadow}`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="nodrag hover:scale-105 active:scale-95"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 12px ${colorScheme.shadow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 6px ${colorScheme.shadow}`;
              }}
            >
              +
            </button>
          </div>
          <button
            onClick={addRow}
            style={{
              background: colorScheme.header,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: `0 4px 6px ${colorScheme.shadow}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="nodrag hover:scale-105 active:scale-95"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 6px 12px ${colorScheme.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 6px ${colorScheme.shadow}`;
            }}
          >
            Add Row
          </button>
        </div>
      </div>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default TableNode;
