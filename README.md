# VectorShift Frontend Technical Assessment
This project contains my submission for the VectorShift Frontend Technical Assessment.  
It includes a React-based frontend built with React Flow, and a FastAPI backend that parses a pipeline graph and checks whether it is a valid DAG.

---

## 🚀 Project Overview

### **Frontend**
- Built using **React** and **React Flow**
- Implements four node types:
  - **Input**
  - **Text**
  - **LLM**
  - **Output**
- Includes a reusable **Base Node** abstraction for consistent UI/UX
- **Text Node Features implemented:**
  - Auto-resizing textarea
  - Dynamic variable detection using `{{variable}}`
  - Automatic left-side input handles for each variable
  - Updated styling and layout improvements

### **Backend**
- Built using **FastAPI**
- Implements `/pipelines/parse` endpoint
- Returns:
  - Number of nodes
  - Number of edges
  - Whether the graph is a **DAG**
- DAG detection implemented using **Kahn’s Algorithm (topological sort)**

---

## 🧪 Demo Pipeline (shown in recording)
Example pipeline used in video:
