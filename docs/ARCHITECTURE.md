# Technical Architecture & Design Document

## 1. System Overview
The AI Campus Concierge System is a full-stack interactive self-service solution designed for touch kiosks and mobile devices. It combines Dijkstra/A* pathfinding algorithms with grounded RAG (Retrieval-Augmented Generation) search over campus knowledge bases.

## 2. Layered Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (Frontend)                   │
│  - React 18 + TypeScript + TailwindCSS (Glassmorphism & Kiosk UI)       │
│  - Interactive 2D Campus Map & Indoor Floor Navigator                  │
│  - AI Chat Assistant with Voice Wave Visualizer & STT/TTS               │
│  - Multilingual Context (10 Languages Supported)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST APIs / HTTP
┌───────────────────────────────────▼────────────────────────────────────┐
│                        SERVICES & ENGINES LAYER                        │
│  - NavigationGraphService: A* Pathfinding over Node-Edge Graph          │
│  - RAGEngine: Term Overlap & Grounded Context Extraction                │
│  - VoiceContext: Web Speech API Integration                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON / Memory Database
┌───────────────────────────────────▼────────────────────────────────────┐
│                          DATA STORAGE LAYER                            │
│  - Buildings, Map Nodes, Faculty, Buses, Hostels, Events Datasets       │
│  - Campus Knowledge Corpus Document Collection                         │
└────────────────────────────────────────────────────────────────────────┘
```

## 3. Pathfinding Algorithm Details
- **Graph Representation**: Campus map and indoor floor plans are modeled as a connected graph of `MapNode` objects.
- **Cost Calculation**:
  - Distance: Euclidean distance between node coordinates `(x, y)`.
  - Floor Switching Penalty: Adding weight for elevators (5m equivalent) vs stairs (20m equivalent).
  - Accessibility Routing: If `accessibleOnly` is enabled, non-accessible nodes (stairs) are filtered out, ensuring wheelchair compliance.

## 4. Grounded RAG AI Search Engine
- **Tokenization & Scoring**: User natural language query is tokenized, stripped of stop words, and scored against `KNOWLEDGE_CORPUS` articles using TF-IDF term overlap and explicit keyword matching.
- **Source Citation**: Top matching document snippets are cited as grounded sources to prevent AI hallucinations.
- **Action Trigger**: If the query implies navigating to a physical location (e.g. "Where is Dr. Alan Turing cabin?"), a `navigationAction` payload is generated, displaying a direct navigation button in the assistant UI.
