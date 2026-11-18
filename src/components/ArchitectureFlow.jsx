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

const TYPE_CONFIG = {
  start: { border: '#0ea5e9', bg: '#f0f9ff', tag: 'ENTRY', label: 'Client / Entry' },
  ui: { border: '#3b82f6', bg: '#eff6ff', tag: 'UI', label: 'Frontend' },
  api: { border: '#6366f1', bg: '#eef2ff', tag: 'API', label: 'API Gateway' },
  service: { border: '#64748b', bg: '#f8fafc', tag: 'SERVICE', label: 'Core Service' },
  decision: { border: '#f59e0b', bg: '#fffbeb', tag: 'ROUTER', label: 'Router' },
  database: { border: '#059669', bg: '#ecfdf5', tag: 'DATA', label: 'Database' },
  cache: { border: '#0284c7', bg: '#f0f9ff', tag: 'CACHE', label: 'Cache' },
  worker: { border: '#475569', bg: '#f1f5f9', tag: 'WORKER', label: 'Worker' },
  end: { border: '#10b981', bg: '#f0fdf4', tag: 'OUTPUT', label: 'Response' },
  default: { border: '#94a3b8', bg: '#f8fafc', tag: 'MODULE', label: 'Component' },
}

function CustomArchitectureNode({ data, selected }) {
  const typeKey = data.typeKey || 'default'
  const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.default

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'var(--color-surface)',
        border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        boxShadow: selected ? '0 0 0 3px var(--color-accent-light), var(--shadow-sm)' : 'var(--shadow-sm)',
        minWidth: '180px',
        maxWidth: '240px',
        fontFamily: 'inherit',
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
      }}
    >
      <Handle
        type="target"
        position={data.targetPosition || Position.Top}
        style={{
          background: config.border,
          width: 8,
          height: 8,
          border: '2px solid var(--color-surface)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '2px 5px',
            borderRadius: '4px',
            background: config.bg,
            color: config.border,
            border: `1px solid ${config.border}33`,
          }}
        >
          {config.tag}
        </span>
        {data.tech && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {data.tech}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', marginBottom: '3px' }}>
        {data.label}
      </div>

      {data.description && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          {data.description}
        </div>
      )}

      <Handle
        type="source"
        position={data.sourcePosition || Position.Bottom}
        style={{
          background: config.border,
          width: 8,
          height: 8,
          border: '2px solid var(--color-surface)',
        }}
      />
    </div>
  )
}

const nodeTypes = {
  customNode: CustomArchitectureNode,
}

export default function ArchitectureFlow({ architecture, repoMeta }) {
  // Always build a clean, strictly vertical default layout
  const initialData = useMemo(() => {
    if (!architecture?.nodes || architecture.nodes.length === 0) {
      return {
        nodes: [
          { id: '1', type: 'customNode', position: { x: 350, y: 40 }, data: { label: 'User Client', typeKey: 'start', tech: 'Browser', description: 'Starts requests', sourcePosition: Position.Bottom, targetPosition: Position.Top } },
          { id: '2', type: 'customNode', position: { x: 350, y: 160 }, data: { label: 'API Gateway', typeKey: 'api', tech: 'Router', description: 'Directs traffic', sourcePosition: Position.Bottom, targetPosition: Position.Top } },
          { id: '3', type: 'customNode', position: { x: 350, y: 280 }, data: { label: 'Application Logic', typeKey: 'service', tech: 'Core', description: 'Processes business rules', sourcePosition: Position.Bottom, targetPosition: Position.Top } },
          { id: '4', type: 'customNode', position: { x: 350, y: 400 }, data: { label: 'Database', typeKey: 'database', tech: 'Storage', description: 'Saves records', sourcePosition: Position.Bottom, targetPosition: Position.Top } },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', label: 'Request', animated: true },
          { id: 'e2-3', source: '2', target: '3', label: 'Dispatches', animated: true },
          { id: 'e3-4', source: '3', target: '4', label: 'Queries', animated: true },
        ],
      }
    }

    // Position each node strictly in a vertical hierarchy by default
    const nodes = architecture.nodes.map((n, idx) => ({
      id: String(n.id || idx + 1),
      type: 'customNode',
      position: { x: 350, y: 40 + idx * 125 },
      data: {
        label: n.data?.label || n.label || `Component ${idx + 1}`,
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
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-border-hover)' },
      style: { stroke: 'var(--color-border-hover)', strokeWidth: 1.5 },
    }))

    return { nodes, edges }
  }, [architecture])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [layoutMode, setLayoutMode] = useState('vertical')
  const [filterType, setFilterType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNodeForm, setNewNodeForm] = useState({ label: '', typeKey: 'service', tech: '', description: '' })

  useEffect(() => {
    setNodes(initialData.nodes)
    setEdges(initialData.edges)
  }, [initialData, setNodes, setEdges])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-border-hover)' },
      style: { stroke: 'var(--color-border-hover)', strokeWidth: 1.5 }
    }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node)
  }, [])

  const applyLayout = (direction) => {
    setLayoutMode(direction)
    const isHoriz = direction === 'horizontal'
    
    setNodes((currentNodes) => {
      return currentNodes.map((node, index) => {
        let x, y
        if (isHoriz) {
          x = 60 + index * 240
          y = 150
        } else {
          x = 350
          y = 40 + index * 125
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

  const visibleNodes = useMemo(() => {
    if (filterType === 'all') return nodes
    return nodes.map(n => ({
      ...n,
      hidden: n.data.typeKey !== filterType
    }))
  }, [nodes, filterType])

  const handleAddNode = (e) => {
    e.preventDefault()
    if (!newNodeForm.label.trim()) return

    const id = `node-${Date.now()}`
    const isHoriz = layoutMode === 'horizontal'
    const newNode = {
      id,
      type: 'customNode',
      position: { x: isHoriz ? 60 + nodes.length * 240 : 350, y: isHoriz ? 150 : 40 + nodes.length * 125 },
      data: {
        label: newNodeForm.label.trim(),
        typeKey: newNodeForm.typeKey,
        tech: newNodeForm.tech.trim(),
        description: newNodeForm.description.trim(),
        sourcePosition: isHoriz ? Position.Right : Position.Bottom,
        targetPosition: isHoriz ? Position.Left : Position.Top,
      }
    }

    setNodes((nds) => [...nds, newNode])
    setShowAddModal(false)
    setNewNodeForm({ label: '', typeKey: 'service', tech: '', description: '' })
  }

  const handleDeleteNode = (idToDelete) => {
    setNodes((nds) => nds.filter((n) => n.id !== idToDelete))
    setEdges((eds) => eds.filter((e) => e.source !== idToDelete && e.target !== idToDelete))
    if (selectedNode?.id === idToDelete) setSelectedNode(null)
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
          >
            Vertical
          </button>
          <button
            type="button"
            className={`btn-tool ${layoutMode === 'horizontal' ? 'active' : ''}`}
            onClick={() => applyLayout('horizontal')}
          >
            Horizontal
          </button>
        </div>

        <div className="toolbar-group">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Components</option>
            <option value="ui">Frontend</option>
            <option value="api">API Gateways</option>
            <option value="service">Core Services</option>
            <option value="database">Databases</option>
          </select>
        </div>
      </div>

      {/* Main Canvas */}
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
          <Background color="var(--color-border)" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const type = node.data?.typeKey
              return TYPE_CONFIG[type]?.border || '#94a3b8'
            }}
            nodeBorderRadius={2}
            maskColor="rgba(0, 0, 0, 0.05)"
          />

          <Panel position="top-right" className="flow-badge-panel">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
          </Panel>
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <aside className="node-inspector">
            <div className="inspector-header">
              <div>
                <h4>{selectedNode.data.label}</h4>
                <span className="badge-type">{TYPE_CONFIG[selectedNode.data.typeKey]?.label}</span>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>

            <div className="inspector-body">
              {selectedNode.data.tech && (
                <div className="inspector-field">
                  <label>Technology</label>
                  <p className="tech-badge-plain">{selectedNode.data.tech}</p>
                </div>
              )}

              <div className="inspector-field">
                <label>Description</label>
                <p>{selectedNode.data.description || 'No description provided.'}</p>
              </div>

              <div className="inspector-field">
                <label>Connections</label>
                <div className="connections-list">
                  <div>
                    <strong>Inputs:</strong>{' '}
                    {edges
                      .filter(e => e.target === selectedNode.id)
                      .map(e => nodes.find(n => n.id === e.source)?.data.label || e.source)
                      .join(', ') || 'None (Initial entry)'}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Outputs:</strong>{' '}
                    {edges
                      .filter(e => e.source === selectedNode.id)
                      .map(e => nodes.find(n => n.id === e.target)?.data.label || e.target)
                      .join(', ') || 'None (Final output)'}
                  </div>
                </div>
              </div>

              <div className="inspector-actions">
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  Remove Component
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Minimal Legend Footer */}
      <footer className="flow-legend">
        <span className="legend-title">Legend:</span>
        {Object.entries(TYPE_CONFIG)
          .filter(([k]) => k !== 'default')
          .map(([key, item]) => (
            <span key={key} className="legend-item">
              <span
                className="legend-color-dot"
                style={{ background: item.bg, borderColor: item.border }}
              ></span>
              {item.label}
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
                <label>Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authentication Handler"
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
                  <option value="ui">Frontend</option>
                  <option value="api">API Gateway</option>
                  <option value="service">Core Service</option>
                  <option value="database">Database</option>
                  <option value="cache">Cache</option>
                  <option value="worker">Worker</option>
                </select>
              </div>

              <div className="form-group">
                <label>Technology (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PostgreSQL, Redis, Node.js"
                  value={newNodeForm.tech}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, tech: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="What this component handles..."
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
    </div>
  )
}
