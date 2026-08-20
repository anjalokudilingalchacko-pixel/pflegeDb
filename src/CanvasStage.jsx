/**
 * CanvasStage.jsx — the free-position canvas shared by presentation slides and flowchart pages.
 * Elements (text/image/rect/ellipse) sit at percentage coordinates so the canvas is resolution-
 * independent; arrows are drawn in an SVG overlay on top. In editable mode, elements can be
 * selected, dragged, and resized via corner handles with plain Pointer Events — no canvas/drag
 * library, consistent with the rest of this app's hand-rolled approach (see MeetView's WebRTC).
 *
 * Known simplification: a shape and its label are two independent elements stacked at the same
 * position (see the flowchart templates), not a single "shape with text" object — moving one
 * doesn't move the other. Fine for a v1 hand-drawn diagram tool; documented so it isn't mistaken
 * for a bug.
 */
import React, { useRef, useEffect, useCallback } from 'react';

const RESIZE_CORNERS = ['nw', 'ne', 'sw', 'se'];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function ElementBody({ element }) {
  if (element.type === 'text') {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
        fontSize: `${element.fontSize || 16}px`, color: element.color || '#1e1b3a',
        fontWeight: element.bold ? 800 : 500, fontStyle: element.italic ? 'italic' : 'normal',
        textAlign: element.align || 'left', whiteSpace: 'pre-wrap', overflow: 'hidden',
        fontFamily: "'Inter', sans-serif", lineHeight: 1.3, padding: '2px', wordBreak: 'break-word'
      }}>{element.text || ''}</div>
    );
  }
  if (element.type === 'image') {
    return element.imageUrl
      ? <img src={element.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
      : (
        <div style={{ width: '100%', height: '100%', background: '#f5f3ff', border: '1.5px dashed #c4b5fd', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '0.72rem', textAlign: 'center', padding: '4px' }}>
          Bild-URL fehlt
        </div>
      );
  }
  if (element.type === 'rect') {
    return <div style={{ width: '100%', height: '100%', background: element.fill || '#ede9fe', border: `2px solid ${element.stroke || '#7c3aed'}`, borderRadius: '8px', boxSizing: 'border-box' }} />;
  }
  if (element.type === 'ellipse') {
    return <div style={{ width: '100%', height: '100%', background: element.fill || '#dbeafe', border: `2px solid ${element.stroke || '#2563eb'}`, borderRadius: '50%', boxSizing: 'border-box' }} />;
  }
  return null;
}

// Listens for pointermove/pointerup for the lifetime of the component and no-ops unless
// dragRef is set — avoids the churn (and self-referential cleanup) of adding/removing global
// listeners on every drag start/end.
function useDragListeners(dragRef, onMove) {
  useEffect(() => {
    const handleMove = (e) => onMove(e, dragRef.current);
    const handleUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragRef, onMove]);
}

function SelectableElement({ element, editable, selected, onSelect, onChange, canvasRef }) {
  const dragRef = useRef(null);

  const onMove = useCallback((e, d) => {
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPct = (e.clientX - d.startClientX) / rect.width * 100;
    const dyPct = (e.clientY - d.startClientY) / rect.height * 100;
    if (d.mode === 'move') {
      onChange({
        ...d.startEl,
        x: clamp(d.startEl.x + dxPct, 0, 100 - d.startEl.w),
        y: clamp(d.startEl.y + dyPct, 0, 100 - d.startEl.h)
      });
    } else if (d.mode === 'resize') {
      let { x, y, w, h } = d.startEl;
      if (d.corner.includes('e')) w = clamp(d.startEl.w + dxPct, 4, 100 - x);
      if (d.corner.includes('s')) h = clamp(d.startEl.h + dyPct, 4, 100 - y);
      if (d.corner.includes('w')) { const newW = clamp(d.startEl.w - dxPct, 4, d.startEl.x + d.startEl.w); x = d.startEl.x + d.startEl.w - newW; w = newW; }
      if (d.corner.includes('n')) { const newH = clamp(d.startEl.h - dyPct, 4, d.startEl.y + d.startEl.h); y = d.startEl.y + d.startEl.h - newH; h = newH; }
      onChange({ ...d.startEl, x, y, w, h });
    }
  }, [canvasRef, onChange]);

  useDragListeners(dragRef, onMove);

  const startDrag = (mode, corner) => (e) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect(element.id);
    dragRef.current = { mode, corner, startClientX: e.clientX, startClientY: e.clientY, startEl: { ...element } };
  };

  return (
    <div
      onPointerDown={startDrag('move')}
      onClick={e => { if (editable) { e.stopPropagation(); onSelect(element.id); } }}
      style={{
        position: 'absolute', left: `${element.x}%`, top: `${element.y}%`, width: `${element.w}%`, height: `${element.h}%`,
        cursor: editable ? 'move' : 'default',
        outline: selected ? '2px solid #7c3aed' : 'none', outlineOffset: '2px'
      }}
    >
      <ElementBody element={element} />
      {editable && selected && RESIZE_CORNERS.map(corner => (
        <div
          key={corner}
          onPointerDown={startDrag('resize', corner)}
          style={{
            position: 'absolute', width: '11px', height: '11px', background: '#fff', border: '2px solid #7c3aed', borderRadius: '3px',
            top: corner.includes('n') ? '-6px' : 'auto', bottom: corner.includes('s') ? '-6px' : 'auto',
            left: corner.includes('w') ? '-6px' : 'auto', right: corner.includes('e') ? '-6px' : 'auto',
            cursor: `${corner}-resize`
          }}
        />
      ))}
    </div>
  );
}

function ArrowLayer({ elements, editable, selectedId, onSelect, onChange, canvasRef }) {
  const dragRef = useRef(null);

  const onMove = useCallback((e, d) => {
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPct = (e.clientX - d.startClientX) / rect.width * 100;
    const dyPct = (e.clientY - d.startClientY) / rect.height * 100;
    if (d.mode === 'move') {
      onChange({ ...d.startEl, x1: clamp(d.startEl.x1 + dxPct, 0, 100), y1: clamp(d.startEl.y1 + dyPct, 0, 100), x2: clamp(d.startEl.x2 + dxPct, 0, 100), y2: clamp(d.startEl.y2 + dyPct, 0, 100) });
    } else if (d.mode === 'start') {
      onChange({ ...d.startEl, x1: clamp(d.startEl.x1 + dxPct, 0, 100), y1: clamp(d.startEl.y1 + dyPct, 0, 100) });
    } else if (d.mode === 'end') {
      onChange({ ...d.startEl, x2: clamp(d.startEl.x2 + dxPct, 0, 100), y2: clamp(d.startEl.y2 + dyPct, 0, 100) });
    }
  }, [canvasRef, onChange]);

  useDragListeners(dragRef, onMove);

  const startDrag = (element, mode) => (e) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect(element.id);
    dragRef.current = { mode, startClientX: e.clientX, startClientY: e.clientY, startEl: { ...element } };
  };

  const arrows = elements.filter(el => el.type === 'arrow');
  if (arrows.length === 0) return null;

  // The canvas box is always 16:9 (CSS aspect-ratio). Matching the viewBox to that same ratio
  // keeps the x/y scale factors equal so a shape drawn in this space renders isotropically
  // instead of getting sheared by a non-uniform stretch — only y needs the 9/16 conversion.
  const VB_H = 56.25; // 100 * 9/16
  const vy = (pct) => pct * VB_H / 100;

  // SVG <marker> arrowheads turned out to render inconsistently under a non-square viewBox in
  // testing, so the arrowhead is built by hand instead: a small triangle computed directly from
  // the line's direction in this already-isotropic coordinate space — fully predictable.
  function arrowHeadPoints(x1, y1, x2, y2, size = 3) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const backX = x2 - ux * size, backY = y2 - uy * size;
    return `${x2},${y2} ${backX + px * size * 0.55},${backY + py * size * 0.55} ${backX - px * size * 0.55},${backY - py * size * 0.55}`;
  }

  return (
    <svg
      viewBox={`0 0 100 ${VB_H}`} preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {arrows.map(a => (
        <g key={a.id}>
          <line
            x1={a.x1} y1={vy(a.y1)} x2={a.x2} y2={vy(a.y2)}
            stroke={a.stroke || '#334155'} strokeWidth={a.strokeWidth || 2}
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
          <polygon
            points={arrowHeadPoints(a.x1, vy(a.y1), a.x2, vy(a.y2))}
            fill={a.stroke || '#334155'}
          />
          <line
            x1={a.x1} y1={vy(a.y1)} x2={a.x2} y2={vy(a.y2)}
            stroke="transparent" strokeWidth={10}
            style={{ vectorEffect: 'non-scaling-stroke', pointerEvents: editable ? 'stroke' : 'none', cursor: 'move', outline: selectedId === a.id ? '1px solid #7c3aed' : 'none' }}
            onPointerDown={startDrag(a, 'move')}
            onClick={e => { if (editable) { e.stopPropagation(); onSelect(a.id); } }}
          />
          {editable && selectedId === a.id && (
            <>
              <circle cx={a.x1} cy={vy(a.y1)} r={2.2} fill="#fff" stroke="#7c3aed" strokeWidth={1.2} style={{ vectorEffect: 'non-scaling-stroke', pointerEvents: 'all', cursor: 'grab' }} onPointerDown={startDrag(a, 'start')} />
              <circle cx={a.x2} cy={vy(a.y2)} r={2.2} fill="#fff" stroke="#7c3aed" strokeWidth={1.2} style={{ vectorEffect: 'non-scaling-stroke', pointerEvents: 'all', cursor: 'grab' }} onPointerDown={startDrag(a, 'end')} />
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function CanvasStage({ elements, background, editable, selectedId, onSelect, onElementsChange }) {
  const canvasRef = useRef(null);

  const updateElement = (updated) => {
    onElementsChange(elements.map(el => el.id === updated.id ? updated : el));
  };

  const handleKeyDown = (e) => {
    if (!editable || !selectedId) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onElementsChange(elements.filter(el => el.id !== selectedId));
      onSelect(null);
    }
  };

  const shapes = elements.filter(el => el.type !== 'arrow');

  return (
    <div
      ref={canvasRef}
      tabIndex={editable ? 0 : -1}
      onKeyDown={handleKeyDown}
      onClick={() => { if (editable) onSelect(null); }}
      style={{
        position: 'relative', width: '100%', aspectRatio: '16 / 9', background: background || '#ffffff',
        borderRadius: '10px', border: '1px solid #e4e8f1', overflow: 'hidden', outline: 'none'
      }}
    >
      {shapes.map(element => (
        <SelectableElement
          key={element.id} element={element} editable={editable}
          selected={selectedId === element.id} onSelect={onSelect}
          onChange={updateElement} canvasRef={canvasRef}
        />
      ))}
      <ArrowLayer elements={elements} editable={editable} selectedId={selectedId} onSelect={onSelect} onChange={updateElement} canvasRef={canvasRef} />
    </div>
  );
}
