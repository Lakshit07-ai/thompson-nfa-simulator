import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const EPSILON = 'ε'

/** Custom circular node */
function StateNode({ data }) {
  const classes = ['nfa-node']
  if (data.isStart) classes.push('start')
  if (data.isFinal) classes.push('final')
  if (data.isActive) classes.push('active')

  return (
    <div className={classes.join(' ')} title={data.label}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  )
}

const nodeTypes = { state: StateNode }

/**
 * Simple layered layout for Thompson NFAs.
 * Places states roughly left-to-right by numeric id.
 */
function layoutNodes(nfa, activeSet) {
  if (!nfa || !nfa.states) return []

  const states = [...nfa.states].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0
    return na - nb
  })

  // Rough columns by state number
  const cols = Math.max(3, Math.ceil(Math.sqrt(states.length * 1.5)))
  return states.map((id, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      id,
      type: 'state',
      position: { x: 80 + col * 140, y: 60 + row * 100 },
      data: {
        label: id,
        isStart: id === nfa.startState,
        isFinal: nfa.finalStates.includes(id),
        isActive: activeSet.has(id),
      },
      draggable: true,
    }
  })
}

function buildEdges(nfa) {
  if (!nfa || !nfa.transitions) return []

  // Group parallel edges between same pair so we can offset them
  const groups = new Map()
  for (const t of nfa.transitions) {
    const key = `${t.from}->${t.to}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(t)
  }

  const edges = []
  let edgeId = 0

  for (const [, group] of groups) {
    group.forEach((t, idx) => {
      const isEpsilon = t.symbol === EPSILON
      const isSelf = t.from === t.to
      edges.push({
        id: `e${edgeId++}`,
        source: t.from,
        target: t.to,
        label: t.symbol,
        type: isSelf ? 'default' : 'smoothstep',
        animated: isEpsilon,
        style: {
          stroke: isEpsilon ? '#7C9CFF' : '#5A6270',
          strokeWidth: 1.5,
          strokeDasharray: isEpsilon ? '4 3' : undefined,
        },
        labelStyle: {
          fill: isEpsilon ? '#7C9CFF' : '#9BA3AF',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 500,
        },
        labelBgStyle: { fill: '#1D2027', fillOpacity: 0.9 },
        labelBgPadding: [4, 3],
        labelBgBorderRadius: 3,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isEpsilon ? '#7C9CFF' : '#5A6270',
        },
        // slight curvature offset for parallel edges
        pathOptions: group.length > 1 ? { offset: (idx - (group.length - 1) / 2) * 18 } : undefined,
      })
    })
  }
  return edges
}

export default function NFAGraph({ nfa, activeStates = [] }) {
  const activeSet = useMemo(() => new Set(activeStates), [activeStates])

  const initialNodes = useMemo(() => layoutNodes(nfa, activeSet), [nfa, activeSet])
  const initialEdges = useMemo(() => buildEdges(nfa), [nfa])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync when NFA or active states change
  useEffect(() => {
    setNodes(layoutNodes(nfa, activeSet))
    setEdges(buildEdges(nfa))
  }, [nfa, activeSet, setNodes, setEdges])

  const onInit = useCallback((instance) => {
    setTimeout(() => instance.fitView({ padding: 0.2 }), 50)
  }, [])

  if (!nfa) return null

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onInit={onInit}
      fitView
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#30343D" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => {
          if (n.data?.isActive) return '#F0B429'
          if (n.data?.isStart) return '#7C9CFF'
          if (n.data?.isFinal) return '#36B37E'
          return '#30343D'
        }}
        maskColor="rgba(16,17,20,0.7)"
      />
    </ReactFlow>
  )
}
