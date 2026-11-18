import React from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node components for different types
const nodeTypes = {
  start: ({ data }) => (
    <div style={nodeStyle('start')}>
      <span style={{fontSize: 18}}>▶</span> {data.label}
    </div>
  ),
  end: ({ data }) => (
    <div style={nodeStyle('end')}>
      <span style={{fontSize: 18}}>■</span> {data.label}
    </div>
  ),
  process: ({ data }) => (
    <div style={nodeStyle('process')}>
      <span style={{fontSize: 16}}>⚙</span> {data.label}
    </div>
  ),
  decision: ({ data }) => (
    <div style={nodeStyle('decision')}>
      <span style={{fontSize: 16}}>◆</span> {data.label}
    </div>
  ),
  database: ({ data }) => (
    <div style={nodeStyle('database')}>
      <span style={{fontSize: 16}}>⟂</span> {data.label}
    </div>
  ),
  api: ({ data }) => (
    <div style={nodeStyle('api')}>
      <span style={{fontSize: 16}}>⌁</span> {data.label}
    </div>
  ),
  service: ({ data }) => (
    <div style={nodeStyle('service')}>
      <span style={{fontSize: 16}}>⚡</span> {data.label}
    </div>
  ),
  ui: ({ data }) => (
    <div style={nodeStyle('ui')}>
      <span style={{fontSize: 16}}>◈</span> {data.label}
    </div>
  ),
  default: ({ data }) => (
    <div style={nodeStyle('default')}>{data.label}</div>
  ),
}

function nodeStyle(type) {
  const colors = {
    start: { bg: '#e8f5e9', border: '#2e7d32', text: '#1b5e20' },
    end: { bg: '#ffebee', border: '#c62828', text: '#b71c1c' },
    process: { bg: '#e3f2fd', border: '#1565c0', text: '#0d47a1' },
    decision: { bg: '#fff3e0', border: '#ef6c00', text: '#e65100' },
    database: { bg: '#f3e5f5', border: '#7b1fa2', text: '#4a148c' },
    api: { bg: '#e0f2f1', border: '#00695c', text: '#004d40' },
    service: { bg: '#fce4ec', border: '#c2185b', text: '#880e4f' },
    ui: { bg: '#ede7f6', border: '#512da8', text: '#311b92' },
    default: { bg: '#f5f5f5', border: '#757575', text: '#212121' },
  }
  const c = colors[type] || colors.default
  return {
    padding: '10px 16px',
    borderRadius: type === 'decision' ? '8px' : type === 'database' ? '4px 4px 0 0' : '8px',
    border: `2px solid ${c.border}`,
    background: c.bg,
    color: c.text,
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'Inter, -apple-system, sans-serif',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    minWidth: 140,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }
}

function ArchitectureViewer({ architecture }) {
  if (!architecture?.nodes?.length) {
    return (
      <div style={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fafafa',
        border: '1px dashed #ddd',
        borderRadius: 12,
        color: '#888'
      }}>
        No architecture diagram generated
      </div>
    )
  }

  const nodes = architecture.nodes.map(n => ({
    ...n,
    type: n.type || 'default',
    sourcePosition: 'bottom',
    targetPosition: 'top',
  }))

  const edges = architecture.edges.map(e => ({
    ...e,
    type: 'smoothstep',
    animated: e.animated || false,
    style: { strokeWidth: 2 },
    markerEnd: {
      type: 'arrowclosed',
      color: '#666',
    },
    labelBgStyle: { fill: '#fff', padding: '2px 6px', borderRadius: 4 },
    labelStyle: { fontSize: 11, fill: '#555' },
  }))

  return (
    <div style={{ width: '100%', height: 500, border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultViewport={{ zoom: 0.8 }}
      >
        <Background color="#f0f0f0" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const typeColors = {
              start: '#2e7d32', end: '#c62828', process: '#1565c0',
              decision: '#ef6c00', database: '#7b1fa2', api: '#00695c',
              service: '#c2185b', ui: '#512da8'
            }
            return typeColors[node.type] || '#666'
          }}
          nodeBorderRadius={4}
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>
      <div style={{ padding: '12px', borderTop: '1px solid #eee', background: '#fafafa', fontSize: 12, color: '#666' }}>
        <strong>Legend:</strong>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '12px'}}>
          <span style={{width: 12, height: 12, background: '#e8f5e9', border: '2px solid #2e7d32', borderRadius: '50%'}}></span> Start
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#ffebee', border: '2px solid #c62828', borderRadius: '50%'}}></span> End
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#e3f2fd', border: '2px solid #1565c0', borderRadius: '50%'}}></span> Process
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#f3e5f5', border: '2px solid #7b1fa2', borderRadius: '50%'}}></span> Database
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#e0f2f1', border: '2px solid #00695c', borderRadius: '50%'}}></span> API
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#fce4ec', border: '2px solid #c2185b', borderRadius: '50%'}}></span> Service
        </span>{' '}
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}>
          <span style={{width: 12, height: 12, background: '#ede7f6', border: '2px solid #512da8', borderRadius: '50%'}}></span> UI
        </span>
      </div>
    </div>
  )
}

export default ArchitectureViewer