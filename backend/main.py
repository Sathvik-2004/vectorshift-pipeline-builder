from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from collections import deque

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Edge(BaseModel):
    source: str
    target: str

class Pipeline(BaseModel):
    nodes: List[Dict]
    edges: List[Edge]

@app.post("/pipelines/parse")
async def parse_pipeline(pipeline: Pipeline):
    nodes = pipeline.nodes or []
    edges = pipeline.edges or []

    node_ids = []
    for i, n in enumerate(nodes):
        nid = n.get("id") if isinstance(n, dict) else None
        node_ids.append(nid or str(i))

    num_nodes = len(node_ids)
    num_edges = len(edges)

    adj = {nid: [] for nid in node_ids}
    indeg = {nid: 0 for nid in node_ids}

    for e in edges:
        s = e.source if hasattr(e, "source") else e.get("source")
        t = e.target if hasattr(e, "target") else e.get("target")
        if s in adj and t in adj:
            adj[s].append(t)
            indeg[t] += 1

    q = deque([n for n in node_ids if indeg[n] == 0])
    visited = 0
    while q:
        u = q.popleft()
        visited += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)

    is_dag = (visited == num_nodes) if num_nodes > 0 else True
    return {"num_nodes": num_nodes, "num_edges": num_edges, "is_dag": is_dag}
