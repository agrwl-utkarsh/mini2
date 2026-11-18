import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Professional Color Palette by Node Type
const TYPE_CONFIG = {
  start: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: '🚀', label: 'Client / Entry' },
  ui: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '💻', label: 'Frontend / UI' },
  api: { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6', icon: '⚡', label: 'API Gateway' },
  service: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚙️', label: 'Core Service' },
  decision: { bg: '#fff7ed', border: '#f97316', text: '#9a3412', icon: '🔀', label: 'Auth / Router' },
  database: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', icon: '🗄️', label: 'Database' },
  cache: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', icon: '⚡', label: 'Cache Store' },
  worker: { bg: '#f1f5f9', border: '#64748b', text: '#334155', icon: '🛠️', label: 'Queue / Worker' },
  end: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '🎯', label: 'Output / Result' },
  default: { bg: '#f8fafc', border: '#94a3b8', text: '#1e293b', icon: '📦', label: 'Component' },
}

// Custom Node Component with proper Handles and rich typography
function CustomArchitectureNode({ data, selected }) {
  const typeKey = data.typeKey || 'default'
  const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.default

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: config.bg,
        border: `2px solid ${selected ? '#2563eb' : config.border}`,
        boxShadow: selected ? '0 0 0 4px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.04)',
        minWidth: '170px',
        maxWidth: '240px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        position: 'relative',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
    >
      <Handle
        type="target"
        position={data.targetPosition || Position.Top}
        style={{
          background: config.border,
          width: 9,
          height: 9,
          border: '2px solid #fff',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{config.icon}</span>
        <span
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.06)',
            color: config.text,
          }}
        >
          {config.label}
        </span>
      </div>

      <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
        {data.label}
      </div>

      {data.tech && (
        <div
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 500,
            padding: '1px 6px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#475569',
            marginBottom: '4px',
          }}
        >
          {data.tech}
        </div>
      )}

      {data.description && (
        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, marginTop: '2px' }}>
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={data.sourcePosition || Position.Bottom}
        style={{
          background: config.border,
          width: 9,
          height: 9,
          border: '2px solid #fff',
        }}
      />
    </div>
  )
}

const nodeTypes = {
  customNode: CustomArchitectureNode,
}

export default function ArchitectureFlow({ architecture, repoMeta }) {
  // Normalize nodes & edges with fallback
  const initialData = useMemo(() => {
    if (!architecture?.nodes || architecture.nodes.length === 0) {
      return {
        nodes: [
          { id: '1', type: 'customNode', position: { x: 350, y: 50 }, data: { label: 'User Client', typeKey: 'start', tech: 'Browser / CLI', description: 'Entry point for requests' } },
          { id: '2', type: 'customNode', position: { x: 350, y: 180 }, data: { label: 'API Gateway', typeKey: 'api', tech: 'Router', description: 'Routes and authorizes requests' } },
          { id: '3', type: 'customNode', position: { x: 350, y: 310 }, data: { label: 'Core Engine', typeKey: 'service', tech: 'App Logic', description: 'Business processing' } },
          { id: '4', type: 'customNode', position: { x: 350, y: 440 }, data: { label: 'Persistence', typeKey: 'database', tech: 'Storage', description: 'Database records' } },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', label: 'HTTP / Call', animated: true },
          { id: 'e2-3', source: '2', target: '3', label: 'Dispatches', animated: true },
          { id: 'e3-4', source: '3', target: '4', label: 'Queries', animated: true },
        ],
      }
    }

    const nodes = architecture.nodes.map((n, idx) => ({
      id: String(n.id || idx + 1),
      type: 'customNode',
      position: n.position || { x: 250 + (idx % 3) * 200, y: 50 + Math.floor(idx / 3) * 140 },
      data: {
        label: n.data?.label || n.label || `Node ${idx + 1}`,
        typeKey: n.type || 'service',
        tech: n.data?.tech || n.tech || '',
        description: n.data?.description || n.description || '',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      },
    }))

    const edges = architecture.edges.map((e, idx) => ({
      id: e.id || `edge-${idx}`,
      source: String(e.source),
      target: String(e.target),
      label: e.label || '',
      animated: e.animated ?? true,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }))

    return { nodes, edges }
  }, [architecture])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [layoutMode, setLayoutMode] = useState('vertical')
  const [filterType, setFilterType] = useState('all')
  const [showMermaidModal, setShowMermaidModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNodeForm, setNewNodeForm] = useState({ label: '', typeKey: 'service', tech: '', description: '' })
  const [copyStatus, setCopyStatus] = useState('')

  // Update when architecture prop changes
  useEffect(() => {
    setNodes(initialData.nodes)
    setEdges(initialData.edges)
  }, [initialData, setNodes, setEdges])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node)
  }, [])

  // Auto Layout switch (Vertical vs Horizontal)
  const applyLayout = (direction) => {
    setLayoutMode(direction)
    const isHoriz = direction === 'horizontal'
    
    setNodes((currentNodes) => {
      return currentNodes.map((node, index) => {
        let x, y
        if (isHoriz) {
          x = 80 + index * 220
          y = 120 + ((index % 2) === 0 ? 0 : 140)
        } else {
          x = 350 + ((index % 2) === 0 ? -120 : 120)
          y = 50 + index * 110
        }

        return {
          ...node,
          position: { x, y },
          data: {
            ...node.data,
            sourcePosition: isHoriz ? Position.Right : Position.Bottom,
            targetPosition: isHoriz ? Position.Left : Position.Top,
          }
        }
      })
    })
  }

  // Filter nodes by category
  const visibleNodes = useMemo(() => {
    if (filterType === 'all') return nodes
    return nodes.map(n => ({
      ...n,
      hidden: n.data.typeKey !== filterType
    }))
  }, [nodes, filterType])

  // Reset to AI architecture
  const handleReset = () => {
    setNodes(initialData.nodes)
    setEdges(initialData.edges)
    setSelectedNode(null)
  }

  // Add custom node
  const handleAddNode = (e) => {
    e.preventDefault()
    if (!newNodeForm.label.trim()) return

    const id = `node-${Date.now()}`
    const newNode = {
      id,
      type: 'customNode',
      position: { x: 350 + Math.floor(Math.random() * 80), y: 200 + Math.floor(Math.random() * 80) },
      data: {
        label: newNodeForm.label.trim(),
        typeKey: newNodeForm.typeKey,
        tech: newNodeForm.tech.trim(),
        description: newNodeForm.description.trim(),
        sourcePosition: layoutMode === 'horizontal' ? Position.Right : Position.Bottom,
        targetPosition: layoutMode === 'horizontal' ? Position.Left : Position.Top,
      }
    }

    setNodes((nds) => [...nds, newNode])
    setShowAddModal(false)
    setNewNodeForm({ label: '', typeKey: 'service', tech: '', description: '' })
  }

  // Delete selected node
  const handleDeleteNode = (idToDelete) => {
    setNodes((nds) => nds.filter((n) => n.id !== idToDelete))
    setEdges((eds) => eds.filter((e) => e.source !== idToDelete && e.target !== idToDelete))
    if (selectedNode?.id === idToDelete) setSelectedNode(null)
  }

  // Export JSON
  const handleExportJson = () => {
    const payload = {
      repository: repoMeta?.fullName || 'repository',
      generatedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.typeKey,
        label: n.data.label,
        tech: n.data.tech,
        description: n.data.description,
        position: n.position
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label
      }))
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoMeta?.repo || 'architecture'}-flow.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate Mermaid Diagram
  const mermaidCode = useMemo(() => {
    let code = 'graph TD\n'
    nodes.forEach(n => {
      const label = (n.data.label || n.id).replace(/["()]/g, '')
      const tech = n.data.tech ? ` [${n.data.tech}]` : ''
      code += `  ${n.id}["${label}${tech}"]\n`
    })
    edges.forEach(e => {
      const label = e.label ? `|${e.label}|` : ''
      code += `  ${e.source} -->${label} ${e.target}\n`
    })
    return code
  }, [nodes, edges])

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidCode)
    setCopyStatus('Copied Mermaid Code!')
    setTimeout(() => setCopyStatus(''), 2500)
  }

  return (
    <div className="architecture-container">
      {/* Top Toolbar */}
      <div className="flow-toolbar">
        <div className="toolbar-group">
          <button type="button" className="btn-tool primary" onClick={() => setShowAddModal(true)}>
            + Add Component
          </button>
          <button
            type="button"
            className={`btn-tool ${layoutMode === 'vertical' ? 'active' : ''}`}
            onClick={() => applyLayout('vertical')}
            title="Vertical Flow (Top-to-Bottom)"
          >
            ⬇ Vertical
          </button>
          <button
            type="button"
            className={`btn-tool ${layoutMode === 'horizontal' ? 'active' : ''}`}
            onClick={() => applyLayout('horizontal')}
            title="Horizontal Flow (Left-to-Right)"
          >
            ➡ Horizontal
          </button>
        </div>

        <div className="toolbar-group">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter components by category"
          >
            <option value="all">Filter: All Components</option>
            <option value="ui">Frontend / UI</option>
            <option value="api">API Gateways</option>
            <option value="service">Core Services</option>
            <option value="database">Databases</option>
            <option value="cache">Caches</option>
            <option value="worker">Workers / Queues</option>
          </select>

          <button type="button" className="btn-tool" onClick={() => setShowMermaidModal(true)}>
            📊 Mermaid Code
          </button>
          <button type="button" className="btn-tool" onClick={handleExportJson}>
            💾 Export JSON
          </button>
          <button type="button" className="btn-tool text-danger" onClick={handleReset} title="Reset to original AI diagram">
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flow-canvas-wrapper">
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
        >
          <Background color="#cbd5e1" gap={18} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const type = node.data?.typeKey
              return TYPE_CONFIG[type]?.border || '#94a3b8'
            }}
            nodeBorderRadius={4}
            maskColor="rgba(241, 245, 249, 0.7)"
          />

          <Panel position="top-right" className="flow-badge-panel">
            <span>{nodes.length} Components</span>
            <span>{edges.length} Connections</span>
          </Panel>
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <aside className="node-inspector" aria-label="Component Inspector">
            <div className="inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>
                  {TYPE_CONFIG[selectedNode.data.typeKey]?.icon || '📦'}
                </span>
                <div>
                  <h4>{selectedNode.data.label}</h4>
                  <span className="badge-type">{TYPE_CONFIG[selectedNode.data.typeKey]?.label}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedNode(null)}
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>

            <div className="inspector-body">
              {selectedNode.data.tech && (
                <div className="inspector-field">
                  <label>Technology / Framework</label>
                  <p className="tech-badge-large">{selectedNode.data.tech}</p>
                </div>
              )}

              <div className="inspector-field">
                <label>Description & Role</label>
                <p>{selectedNode.data.description || 'No specific role description provided for this node.'}</p>
              </div>

              <div className="inspector-field">
                <label>Connected Connections</label>
                <div className="connections-list">
                  <div>
                    <strong>Inputs from:</strong>{' '}
                    {edges
                      .filter(e => e.target === selectedNode.id)
                      .map(e => nodes.find(n => n.id === e.source)?.data.label || e.source)
                      .join(', ') || 'None (Ingress entry point)'}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Outputs to:</strong>{' '}
                    {edges
                      .filter(e => e.source === selectedNode.id)
                      .map(e => nodes.find(n => n.id === e.target)?.data.label || e.target)
                      .join(', ') || 'None (Terminal node)'}
                  </div>
                </div>
              </div>

              <div className="inspector-actions">
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  🗑 Remove Component
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Legend Footer */}
      <footer className="flow-legend">
        <strong>Component Types:</strong>
        {Object.entries(TYPE_CONFIG)
          .filter(([k]) => k !== 'default')
          .map(([key, item]) => (
            <span key={key} className="legend-item">
              <span
                className="legend-color-dot"
                style={{ background: item.bg, borderColor: item.border }}
              ></span>
              {item.icon} {item.label}
            </span>
          ))}
      </footer>

      {/* Add Component Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Architecture Component</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddNode} className="modal-form">
              <div className="form-group">
                <label>Component Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe Payment Handler"
                  value={newNodeForm.label}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, label: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Component Type</label>
                <select
                  value={newNodeForm.typeKey}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, typeKey: e.target.value })}
                >
                  <option value="ui">Frontend / UI</option>
                  <option value="api">API Gateway / Router</option>
                  <option value="service">Core Service</option>
                  <option value="decision">Auth / Security / Decision</option>
                  <option value="database">Database / Persistence</option>
                  <option value="cache">Cache Store</option>
                  <option value="worker">Background Queue / Worker</option>
                  <option value="end">Output / Response</option>
                </select>
              </div>

              <div className="form-group">
                <label>Technology (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PostgreSQL, Redis, Express, Docker"
                  value={newNodeForm.tech}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, tech: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Explain its responsibility within the project..."
                  value={newNodeForm.description}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mermaid Export Modal */}
      {showMermaidModal && (
        <div className="modal-backdrop" onClick={() => setShowMermaidModal(false)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mermaid Markdown Diagram</h3>
              <button type="button" className="close-btn" onClick={() => setShowMermaidModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              Paste this directly into your GitHub README.md in a <code>```mermaid</code> block to display this architecture natively on GitHub!
            </p>
            <pre className="mermaid-code-block">
              <code>{mermaidCode}</code>
            </pre>
            <div className="modal-actions">
              {copyStatus && <span className="copy-feedback">{copyStatus}</span>}
              <button type="button" className="btn-secondary" onClick={() => setShowMermaidModal(false)}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={copyMermaid}>
                📋 Copy Mermaid Syntax
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
