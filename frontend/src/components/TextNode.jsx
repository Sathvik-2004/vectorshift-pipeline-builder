import React, { useEffect, useRef, useState } from "react";
import BaseNode from "./BaseNode";
import { Handle, Position } from "reactflow";
import { useStore } from "../store";

function extractVars(text) {
  const regex = /\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\}\}/g;
  const set = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) set.add(m[1]);
  return Array.from(set);
}

export default function TextNode({ id, data }) {
  const [text, setText] = useState(data?.text || "");
  const updateNodeField = useStore((s) => s.updateNodeField);
  const taRef = useRef(null);

  // keep local text in sync if parent updates `data.text`
  useEffect(() => {
    if (typeof data?.text !== 'undefined' && data.text !== text) {
      setText(data.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.text]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [text]);

  const vars = extractVars(text);

  return (
    <div style={{ minWidth: 220 }}>
      {vars.map((v, i) => (
        <Handle
          key={`var-${v}-${id}`}
          id={`var-${v}-${id}`}
          type="target"
          position={Position.Left}
          style={{ top: 28 + i * 22 }}
        />
      ))}
      {/* Add a stable source handle on the right so Text nodes can connect to others */}
      <Handle
        type="source"
        position={Position.Right}
        id={`out-${id}`}
        style={{ right: 8 }}
      />
      <BaseNode title="Text">
        <textarea ref={taRef} value={text} onChange={e=>{
          const val = e.target.value;
          setText(val);
          try { updateNodeField(id, 'text', val); } catch(e) {}
        }}
          placeholder="Type and use {{var}} to create handles"
          style={{ width: "100%", resize: "none", overflow: "hidden", borderRadius: 6 }} />
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
          {vars.length ? `Variables: ${vars.join(", ")}` : "No variables"}
        </div>
      </BaseNode>
    </div>
  );
}
