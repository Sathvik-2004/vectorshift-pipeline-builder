import React, { useState } from 'react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import submitPipeline from './submit';
import { useStore } from './store';
import { addEdge } from 'reactflow';

function DebugPanel() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const [storeJson, setStoreJson] = useState(null);

  const createTestEdge = () => {
    if (!nodes || nodes.length < 2) {
      alert('Create at least two nodes first (an Input/LLM and a Text/Output node)');
      return;
    }

    // prefer a source node that exposes a source handle (Input -> "-value", LLM -> "-response")
    const sourceNode = nodes.find((n) => n.type === 'customInput' || n.type === 'llm' || n.type === 'customOutput') || nodes[0];

    // prefer a text or output node as target that may expose a variable handle
    const targetNode = nodes.find((n) => n.type === 'text' || n.type === 'customOutput') || nodes[1];

    // determine source handle name based on node type
    let sourceHandle;
    if (sourceNode.type === 'customInput') sourceHandle = `${sourceNode.id}-value`;
    else if (sourceNode.type === 'llm') sourceHandle = `${sourceNode.id}-response`;
    else if (sourceNode.type === 'customOutput') sourceHandle = `${sourceNode.id}-value`;

    // determine a target handle (for text nodes, look for the first {{var}})
    let targetHandle;
    if (targetNode.type === 'text') {
      const txt = targetNode.data?.text || '';
      const m = txt.match(/\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\}\}/);
      if (m) targetHandle = `var-${m[1]}-${targetNode.id}`;
    } else if (targetNode.type === 'customOutput') {
      targetHandle = `${targetNode.id}-value`;
    }

    if (!sourceHandle) {
      alert('No node with a source handle found. Add an Input or LLM node to act as the source.');
      return;
    }

    if (!targetHandle) {
      alert('No suitable target handle found. Add a Text node with a {{var}} or an Output node.');
      return;
    }

    const newEdge = {
      id: `e-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
      source: sourceNode.id,
      target: targetNode.id,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      type: 'smoothstep',
    };

    // add edge to zustand store and give immediate feedback
    const currentEdges = useStore.getState().edges || [];
    const newEdges = addEdge(newEdge, currentEdges);
    useStore.setState({ edges: newEdges });
    console.log('Created edge', newEdge);
    alert(`Created test edge ${newEdge.id}`);
  };

  const edgeCount = edges ? edges.length : 0;
  const nodeCount = nodes ? nodes.length : 0;
  const lastEdge = edges && edges.length ? edges[edges.length - 1] : null;

  const handleLogStore = () => {
    const s = useStore.getState();
    // show in-page for users who don't open devtools
    setStoreJson(JSON.stringify(s, null, 2));
    // also log to console for advanced inspection
    console.log('store', s);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 12 }}>
      <div style={{ marginBottom: 6 }}>
        <strong>Nodes:</strong> {nodeCount} &nbsp; <strong>Edges:</strong> {edgeCount} {lastEdge ? ` (last: ${lastEdge.id})` : ''}
      </div>
      <button onClick={handleLogStore}>Log store</button>
      <button style={{ marginLeft: 8 }} onClick={createTestEdge}>Create test edge</button>
      <button style={{ marginLeft: 8 }} onClick={async () => {
        // auto-connect Input -> Text -> Output and then submit
        const s = useStore.getState();
        const curNodes = s.nodes || [];
        const curEdges = s.edges || [];

        const inputNode = curNodes.find(n => n.type === 'customInput');
        const textNode = curNodes.find(n => n.type === 'text');
        const outputNode = curNodes.find(n => n.type === 'customOutput');

        if (!inputNode || !textNode || !outputNode) {
          alert('Need one Input, one Text, and one Output node on the canvas to auto-connect');
          return;
        }

        let newEdges = [...curEdges];

        const ensureEdge = (src, tgt, srcHandle, tgtHandle) => {
          const exists = newEdges.some(e => e.source === src && e.target === tgt);
          if (!exists) {
            const e = { id: `e-${src}-${tgt}-${Date.now()}`, source: src, target: tgt, sourceHandle: srcHandle, targetHandle: tgtHandle, type: 'smoothstep' };
            newEdges = addEdge(e, newEdges);
          }
        };

        // Input -> Text (target handle: var-<var>-<textId>) - pick first var from textNode
        const txt = textNode.data?.text || '';
        const m = txt.match(/\{\{\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\}\}/);
        const varName = m ? m[1] : null;
        const inputSourceHandle = `${inputNode.id}-value`;
        const textTargetHandle = varName ? `var-${varName}-${textNode.id}` : undefined;
        if (!textTargetHandle) {
          alert('Text node has no {{var}} to connect to — add one (e.g., {{name}}) before auto-connecting');
          return;
        }

        ensureEdge(inputNode.id, textNode.id, inputSourceHandle, textTargetHandle);

        // Text -> Output (Text source handle is out-<textId>, Output target handle is <outputId>-value)
        const textSourceHandle = `out-${textNode.id}`;
        const outputTargetHandle = `${outputNode.id}-value`;
        ensureEdge(textNode.id, outputNode.id, textSourceHandle, outputTargetHandle);

        // commit edges and submit
        useStore.setState({ edges: newEdges });
        // give a small delay so store updates propagate visually
        await new Promise((r) => setTimeout(r, 50));
        const stateNow = useStore.getState();
        await submitPipeline(stateNow.nodes || [], stateNow.edges || []);
      }}>Auto-connect & Submit</button>
      {storeJson && (
        <div style={{ textAlign: 'left', margin: '12px auto', maxWidth: 1000 }}>
          <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>Store JSON (read-only):</div>
          <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', background: '#f7f7f7', padding: 8, borderRadius: 6 }}>{storeJson}</pre>
        </div>
      )}
    </div>
  );
}

function App() {
  const handleTestSubmit = async () => {
    // sample pipeline for quick connectivity test
    const nodes = [{ id: 'n1', type: 'text', data: { text: 'Hello {{name}}' } }, { id: 'n2', type: 'text', data: { text: 'World' } }];
    const edges = [{ source: 'n1', target: 'n2' }];
    await submitPipeline(nodes, edges);
  }

  return (
    <div>
      <PipelineToolbar />
      <PipelineUI />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        <SubmitButton />
        <button onClick={handleTestSubmit}>Test Submit</button>
      </div>
      <DebugPanel />
    </div>
  );
}

export default App;
