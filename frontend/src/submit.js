import { useStore } from './store';

export default async function submitPipeline(nodes, edges) {
  const payload = {
    nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data || {} })),
    edges: edges.map(e => ({ source: e.source, target: e.target })),
  };

  try {
    const resp = await fetch("http://localhost:8000/pipelines/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const t = await resp.text();
      alert("Server error: " + t);
      return;
    }
    const json = await resp.json();
    alert(`Pipeline parsed:\n• Nodes: ${json.num_nodes}\n• Edges: ${json.num_edges}\n• Is DAG: ${json.is_dag ? "Yes" : "No"}`);
  } catch (err) {
    alert("Failed to submit pipeline: " + err.message);
  }
}
// submit.js

export const SubmitButton = () => {
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);

  const onSubmit = () => {
    submitPipeline(nodes, edges);
  }

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <button type="button" onClick={onSubmit}>Submit</button>
    </div>
  );
}
