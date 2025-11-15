import React from "react";
import { Handle, Position } from "reactflow";

export default function BaseNode({ title, inputs = [], outputs = [], children }) {
  return (
    <div style={{ minWidth: 200, background: "#fff", border: "1px solid #e6e9ee", borderRadius: 8, padding: 8 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {inputs.map((h,i) => <Handle key={h.id||i} id={h.id||`in-${i}`} type="target" position={Position.Left} style={{ top: 28 + i*18 }} />)}
      {outputs.map((h,i) => <Handle key={h.id||i} id={h.id||`out-${i}`} type="source" position={Position.Right} style={{ top: 28 + i*18 }} />)}
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}
