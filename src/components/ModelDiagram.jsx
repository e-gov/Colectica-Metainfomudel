import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ReactFlow, Background, Controls, ControlButton, Handle, Position,
  BaseEdge, EdgeLabelRenderer, getSmoothStepPath,
} from '@xyflow/react';
import { model, layout, objectById, groupById, objectPath, relationsFor } from '../model.js';
import Icon from './Icon.jsx';

const sides = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };
function ObjectNode({ data }) {
  const object = data.object;
  const group = groupById[object.group];
  return <div className={`object-node ${data.focus ? 'object-node--focus' : ''} ${data.dimmed ? 'object-node--dimmed' : ''}`} style={{ '--group-color': group.color }}>
    {Object.entries(sides).map(([id, position]) => <Handle key={`${id}-in`} id={`${id}-in`} type="target" position={position} isConnectable={false} />)}
    {Object.entries(sides).map(([id, position]) => <Handle key={`${id}-out`} id={`${id}-out`} type="source" position={position} isConnectable={false} />)}
    <Link to={objectPath(object.id)} className="object-node__link nodrag nopan" aria-label={`Otsi üksikasju: ${object.name} (${object.nameEn})`}>
      <span className="object-node__category">{object.kind === 'description' ? 'Kirjeldusosa' : group.name}</span>
      <strong>{object.name}</strong>
      <span className="object-node__english">{object.nameEn}</span>
      <span className="object-node__arrow"><Icon name="arrow" size={16}/></span>
    </Link>
  </div>;
}

function RelationEdge(props) {
  const [path, labelX, labelY] = getSmoothStepPath({ ...props, borderRadius: 12, offset: 32 });
  const data = props.data;
  return <>
    <BaseEdge id={props.id} path={path} style={{ stroke: data.dimmed ? '#ddd' : '#888', strokeWidth: 1.5, strokeDasharray: data.interpretation ? '5 5' : undefined }} />
    {data.showLabels && <EdgeLabelRenderer><span className={`relation-label ${data.dimmed ? 'relation-label--dimmed' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{data.label}</span></EdgeLabelRenderer>}
  </>;
}
const nodeTypes = { object: ObjectNode };
const edgeTypes = { relation: RelationEdge };

function neighbourhoodLayout(focusId, visibleRelations) {
  const incoming = visibleRelations.filter((r) => r.target === focusId).map((r) => r.source);
  const outgoing = visibleRelations.filter((r) => r.source === focusId).map((r) => r.target);
  const result = { [focusId]: { x: 370, y: Math.max(incoming.length, outgoing.length, 1) * 78 - 50 } };
  incoming.forEach((id, i) => { result[id] = { x: 0, y: i * 156 }; });
  outgoing.forEach((id, i) => { result[id] = { x: 740, y: i * 156 }; });
  return result;
}

export default function ModelDiagram({ focusId, highlightId }) {
  const navigate = useNavigate();
  const [showLabels, setShowLabels] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [instance, setInstance] = useState(null);
  const [pointerDown, setPointerDown] = useState(false);
  const visibleRelations = useMemo(() => focusId ? relationsFor(focusId) : model.relations, [focusId]);
  const { nodes, edges } = useMemo(() => {
    const ids = focusId ? new Set([focusId, ...visibleRelations.flatMap((r) => [r.source, r.target])]) : new Set(model.objects.map((o) => o.id));
    const positions = focusId ? neighbourhoodLayout(focusId, visibleRelations) : layout.positions;
    const near = highlightId ? new Set([highlightId, ...relationsFor(highlightId).flatMap((r) => [r.source, r.target])]) : null;
    return {
      nodes: [...ids].map((id) => ({ id, type: 'object', position: positions[id], width: 260, height: 104, data: { object: objectById[id], focus: id === focusId || id === highlightId, dimmed: near && !near.has(id) } })),
      edges: visibleRelations.map((r) => {
        const route = focusId ? { source: 'right', target: 'left' } : layout.routes[r.id];
        return { id: r.id, source: r.source, target: r.target, sourceHandle: `${route.source}-out`, targetHandle: `${route.target}-in`, type: 'relation', data: { label: r.label, interpretation: r.demoInterpretation, showLabels, dimmed: near && r.source !== highlightId && r.target !== highlightId } };
      }),
    };
  }, [focusId, highlightId, visibleRelations, showLabels]);

  function toggleExpanded() {
    setExpanded((value) => !value);
    requestAnimationFrame(() => requestAnimationFrame(() => instance?.fitView({ padding: 0.1, duration: 250 })));
  }
  return <section className={`diagram ${focusId ? 'diagram--detail' : ''} ${expanded ? 'diagram--expanded' : ''}`} aria-label={focusId ? `${objectById[focusId].name}: otsesed seosed` : 'Alusmudeli interaktiivne skeem'} onKeyDown={(event) => { if (event.key === 'Escape' && expanded) toggleExpanded(); }}>
    <div className="diagram__toolbar">
      <span className="diagram__title"><span className="live-dot"/>{focusId ? 'Objekti lähiümbrus' : 'Alusmudel'}<span className="diagram__count">{nodes.length} kirjet · {edges.length} seost</span></span>
      <div className="diagram__actions">
        <label className="switch"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)}/><span>Seosenimed</span></label>
        <button className="icon-button" onClick={toggleExpanded} aria-label={expanded ? 'Sulge suur vaade' : 'Ava suur vaade'} title={expanded ? 'Sulge suur vaade' : 'Ava suur vaade'}><Icon name={expanded ? 'close' : 'expand'}/></button>
      </div>
    </div>
    <div className={`diagram__canvas ${pointerDown ? 'is-panning' : ''}`}>
      <ReactFlow key={focusId || 'base'} nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        onNodeClick={(event, node) => { if (!event.target.closest('a')) navigate(objectPath(node.id)); }}
        onInit={setInstance} fitView fitViewOptions={{ padding: 0.1 }} minZoom={0.22} maxZoom={1.65}
        nodesDraggable={false} nodesConnectable={false} edgesFocusable={false} nodesFocusable={false}
        elementsSelectable={false} deleteKeyCode={null} zoomOnScroll={false} zoomOnDoubleClick={false}
        panOnDrag selectionOnDrag={false} onMoveStart={() => setPointerDown(true)} onMoveEnd={() => setPointerDown(false)}
        ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': 'Suurenda skeemi', 'controls.zoomOut.ariaLabel': 'Vähenda skeemi', 'controls.fitView.ariaLabel': 'Mahuta kogu skeem' }}>
        <Background color="#ddd" gap={24} size={0.6}/>
        <Controls showInteractive={false} position="bottom-left"><ControlButton onClick={() => instance?.setViewport({ x: 40, y: 40, zoom: 1 }, { duration: 250 })} title="Tegelik suurus" aria-label="Tegelik suurus">1:1</ControlButton></Controls>
      </ReactFlow>
    </div>
    <div className="diagram__footer"><span>Vali objekt, et vaadata selle seoseid.</span><span>Nihuta lohistades · suurenda nuppudega</span></div>
  </section>;
}
