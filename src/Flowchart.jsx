import React, { useState, useCallback } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

const initialNodes = [
  { id: '1', type: 'default', position: { x: 250, y: 50 }, data: { label: 'Start' } },
  { id: '2', type: 'default', position: { x: 100, y: 200 }, data: { label: 'Process A' } },
  { id: '3', type: 'default', position: { x: 400, y: 200 }, data: { label: 'Process B' } },
  { id: '4', type: 'default', position: { x: 250, y: 350 }, data: { label: 'Decision' } },
  { id: '5', type: 'default', position: { x: 100, y: 500 }, data: { label: 'End' } },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5', label: 'Yes' },
]

function Flowchart() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [nodeIdCounter, setNodeIdCounter] = useState(6)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback((type = 'default', position = { x: 300, y: 300 }) => {
    const newNode = {
      id: String(nodeIdCounter),
      type,
      position,
      data: { label: `Node ${nodeIdCounter}` },
    }
    setNodes((nds) => [...nds, newNode])
    setNodeIdCounter((c) => c + 1)
  }, [nodeIdCounter, setNodes])

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const exportFlow = useCallback(() => {
    const data = { nodes, edges }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowchart.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  const importFlow = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result)
        if (data.nodes) setNodes(data.nodes)
        if (data.edges) setEdges(data.edges)
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#fafafa' }}>
        <button onClick={() => addNode('default')}>+ Add Node</button>
        <button onClick={deleteSelected} style={{ marginLeft: 'auto' }}>🗑 Delete Selected</button>
        <button onClick={exportFlow}>💾 Export JSON</button>
        <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && importFlow(e.target.files[0])} style={{ display: 'none' }} id="import-file" ref={(el) => el?.click()} />
        <label htmlFor="import-file" style={{ cursor: 'pointer' }}>📁 Import JSON</label>
        <div style={{ marginLeft: 'auto', color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Nodes: {nodes.length}</span>
          <span>Edges: {edges.length}</span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#eee" gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => (node.selected ? '#ff6b6b' : '#333')}
          nodeStrokeColor={(node) => (node.selected ? '#fff' : 'transparent')}
          nodeBorderRadius={4}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>

      {/* Help Panel */}
      <Panel position="bottom-right" style={{ padding: '12px', background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', minWidth: 280 }}>
        <h4 style={{ margin: '0 0 8px' }}>Shortcuts</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: '#444' }}>
          <li>Drag canvas to pan</li>
          <li>Scroll to zoom</li>
          <li>Drag node handles to connect</li>
          <li>Click node to select, Shift+Click multi-select</li>
          <li>Delete/Backspace to remove selected</li>
          <li>Double-click node to edit label (coming soon)</li>
        </ul>
      </Panel>
    </div>
  )
}

export default Flowchart