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
        border: "1px solid #2f2f2f",
        borderRadius: 10,
        padding: 10,
        minWidth: Math.max(280, data.columns.length * 100),
        maxWidth: 600,
        background: "#ffffff",
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 12,
        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
      }}
    >
      {/* Table Name and Delete Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <input
          value={data.tableName}
          onChange={(e) => onRenameTable && onRenameTable(id, e.target.value)}
          className="nodrag"
          style={{
            flex: 1,
            fontWeight: 700,
            textAlign: "center",
            fontSize: 14,
            border: "none",
            borderBottom: "2px solid #e0e0e0",
            padding: 6,
            background: "#333",
            color: "#fff",
            borderRadius: 6,
          }}
        />
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete the table '${data.tableName}'?`)) {
              onDeleteTable && onDeleteTable(id);
            }
          }}
          className="nodrag"
          style={{
            background: "#ff4757",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          title="Delete table"
        >
          ×
        </button>
      </div>

      {/* Primary Key selection */}
      {data.columns.length > 0 && (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "#444" }}>Primary Key:</span>
          {data.columns.map((col, idx) => (
            <label key={idx} className="nodrag" style={{ marginRight: 8, fontSize: 12, color: "#333", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={data.primaryKeys && data.primaryKeys.includes(col.name)}
                onChange={() => onSetPrimaryKey && onSetPrimaryKey(id, col.name)}
                className="nodrag"
                style={{ marginRight: 6 }}
              />
              {formatDisplayName(col.name)}
            </label>
          ))}
          {data.primaryKeys && data.primaryKeys.length > 1 && (
            <span style={{ fontSize: 11, color: "#666", fontStyle: "italic" }}>
              (Composite Key)
            </span>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 8,
            background: "#fdecea",
            color: "#b71c1c",
            border: "1px solid #f5c6cb",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Table Grid */}
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, marginBottom: 8 }}>
        <thead>
          <tr>
            {data.columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "4px 6px",
                  background: "#f8fafc",
                  color: "#374151",
                  minWidth: "80px",
                  maxWidth: "150px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      value={col.name}
                      onChange={(e) => onRenameColumn && onRenameColumn(id, idx, e.target.value)}
                      className="nodrag"
                      style={{
                        width: "100%",
                        border: "none",
                        textAlign: "center",
                        fontSize: 11,
                        background: "transparent",
                        color: "#111827",
                        fontWeight: 600,
                      }}
                    />
                    <button
                      onClick={() => onRemoveColumn && onRemoveColumn(id, idx)}
                      className="nodrag"
                      style={{ fontSize: 10, padding: "1px 4px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={col.type}
                    onChange={(e) => onChangeColumnType && onChangeColumnType(id, idx, e.target.value)}
                    className="nodrag"
                    style={{ fontSize: 10, padding: "2px", width: "100%" }}
                  >
                    <option>TEXT</option>
                    <option>INTEGER</option>
                    <option>REAL</option>
                    <option>BOOLEAN</option>
                    <option>VARCHAR(100)</option>
                    <option>DATE</option>
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
            {data.values?.[0]?.length > 0 && <th style={{ border: "1px solid #e5e7eb", background: "#f8fafc" }}></th>}
          </tr>
        </thead>
        <tbody>
          {data.columns.length === 0 ? (
            <tr>
              <td style={{ padding: 6, textAlign: "center", color: "#777" }}>
                Add a column to start entering rows.
              </td>
            </tr>
          ) : data.values && data.values[0] && data.values[0].length > 0 ? (
            Array.from({ length: data.values[0].length }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {data.columns.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "6px 8px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#111827",
                    }}
                  >
                    <input
                      value={data.values[colIdx]?.[rowIdx] ?? ""}
                      onChange={(e) => onUpdateCell && onUpdateCell(id, rowIdx, colIdx, e.target.value)}
                      className="nodrag"
                      style={{ width: "100%", border: "none", textAlign: "center", background: "transparent" }}
                    />
                  </td>
                ))}
                <td style={{ border: "1px solid #e5e7eb", padding: 0 }}>
                  <button
                    onClick={() => onRemoveRow && onRemoveRow(id, rowIdx)}
                    className="nodrag"
                    style={{ fontSize: 12, padding: "4px 8px", color: "#b91c1c" }}
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
                <td key={colIdx} style={{ border: "1px solid #e5e7eb", padding: 0 }}>
                  <input
                    value={newRowValues[colIdx]}
                    placeholder={col.name}
                    onChange={(e) => handleRowInputChange(colIdx, e.target.value)}
                    className="nodrag"
                    style={{
                      width: "100%",
                      border: "none",
                      padding: "6px 8px",
                      fontSize: 12,
                      boxSizing: "border-box",
                      color: "#111827",
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

      {/* Add Column and Add Row Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", flex: 1, marginRight: 4 }}>
          <input
            type="text"
            value={newCol}
            placeholder="Add column"
            onChange={(e) => setNewCol(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addColumn();
            }}
            className="nodrag"
            style={{ flex: 1, fontSize: 12, padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6 }}
          />
          <button
            onClick={addColumn}
            className="nodrag"
            style={{
              marginLeft: 6,
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 6,
              background: "#111827",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
        <button
          onClick={addRow}
          className="nodrag"
          style={{
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 6,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Row
        </button>
      </div>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default TableNode;

