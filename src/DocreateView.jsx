/**
 * DocreateView.jsx — Docreate: a freeform slide editor (PowerPoint/Google-Slides style).
 *
 * Each slide is a canvas of independently positioned elements — text boxes, images, shapes —
 * that can be dragged, resized, layered and styled (font, size, color, bold/italic/underline,
 * alignment, bullet/numbered lists, line spacing). Slides render at a fixed 960x540 design
 * resolution and are scaled via CSS transform to fit whatever container they're shown in (the
 * editor's card, or the fullscreen Present view), so a single geometry model works everywhere.
 *
 * Text formatting uses the browser's native contentEditable + document.execCommand: each text
 * box carries box-level defaults (font/size/color/weight/style/align/line-height) applied as CSS,
 * and execCommand is used on top of that for per-selection overrides (e.g. bolding one word)
 * exactly like a real rich-text editor. Presentations save to this app's own JSON backend.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfileMenu, AvatarCircle, authHeaders } from './feedShared';
import { LogoDocreate } from './icons';

const DESIGN_W = 960;
const DESIGN_H = 540;

const DC_CSS = `
:root {
  --dc-bg: #FFFFFF;
  --dc-surface: #FAF8F6;
  --dc-ink: #241B14;
  --dc-muted: #8A7A6C;
  --dc-border: #EFE6DD;
  --dc-accent: #F97316;
  --dc-accent-deep: #C2410C;
  --dc-accent-soft: #FFF1E7;
}
.dc-scroll { flex: 1; overflow-y: auto; background: var(--dc-bg); }
.dc-btn-primary { background: var(--dc-accent); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; }
.dc-btn-primary:hover { background: var(--dc-accent-deep); }
.dc-btn-primary:disabled { background: #E7DDD4; color: #B0A290; cursor: not-allowed; }
.dc-btn-outline { background: #fff; color: var(--dc-ink); border: 1px solid var(--dc-border); border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; font-family: 'Inter', sans-serif; }
.dc-btn-outline:hover { background: var(--dc-surface); border-color: #E0D2C4; }
.dc-card { background: #fff; border-radius: 14px; padding: 18px; border: 1px solid var(--dc-border); transition: box-shadow 0.15s ease, border-color 0.15s ease; }
.dc-card:hover { box-shadow: 0 6px 20px -10px rgba(36,27,20,0.18); border-color: #E0D2C4; }
.dc-field-label { display: block; font-weight: 600; font-size: 0.75rem; color: var(--dc-muted); margin: 12px 0 4px 0; }
.dc-field-label:first-child { margin-top: 0; }
.dc-field-input { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dc-border); font-size: 0.82rem; font-family: 'Inter', sans-serif; outline: none; }
.dc-field-input:focus { border-color: var(--dc-accent); }
.dc-tbtn { background: #fff; border: 1px solid var(--dc-border); border-radius: 7px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; color: var(--dc-ink); font-family: 'Inter', sans-serif; }
.dc-tbtn:hover { background: var(--dc-surface); }
.dc-tbtn.active { background: var(--dc-accent-soft); border-color: var(--dc-accent); color: var(--dc-accent-deep); }
.dc-insert-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #fff; border: 1px solid var(--dc-border); border-radius: 10px; padding: 8px 14px; cursor: pointer; font-size: 0.7rem; font-weight: 600; color: var(--dc-ink); font-family: 'Inter', sans-serif; }
.dc-insert-btn:hover { background: var(--dc-accent-soft); border-color: #FCD3AE; }
.dc-el-content[contenteditable="true"]:focus { outline: none; }
.dc-el-content ul { margin: 0; padding-left: 1.2em; list-style-position: inside; }
.dc-el-content ol { margin: 0; padding-left: 1.2em; list-style-position: inside; }
.dc-el-content div, .dc-el-content p { margin: 0; }
`;

// =====================================================================
// Geometry / element model
// =====================================================================
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function stripHtml(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

const FONT_FAMILIES = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Impact', value: "Impact, 'Arial Narrow Bold', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Space Mono', value: "'Space Mono', monospace" },
];

function newTextElement(opts = {}) {
  return {
    id: uid('el'), type: 'text', zIndex: 1,
    x: 120, y: 220, width: 720, height: 100,
    html: '<div>Text</div>',
    fontFamily: FONT_FAMILIES[0].value, fontSize: 28, color: '#241B14',
    bold: false, italic: false, underline: false, align: 'left', lineHeight: 1.3,
    ...opts,
  };
}
function newImageElement(opts = {}) {
  return { id: uid('el'), type: 'image', zIndex: 1, x: 280, y: 120, width: 400, height: 300, src: '', alt: '', borderRadius: 0, ...opts };
}
function newShapeElement(shape, opts = {}) {
  return {
    id: uid('el'), type: 'shape', zIndex: 1,
    x: 330, y: 170, width: shape === 'ellipse' ? 220 : 300, height: shape === 'ellipse' ? 220 : 180,
    shape, fill: '#F97316', borderColor: '#C2410C', borderWidth: 0, borderRadius: 12,
    ...opts,
  };
}
function newSlide() {
  return {
    id: uid('sl'), background: '#ffffff',
    elements: [newTextElement({ x: 80, y: 210, width: 800, height: 120, fontSize: 44, align: 'center', html: '<div>New slide</div>' })],
  };
}
function svgDataUri(svg) { return `data:image/svg+xml,${encodeURIComponent(svg)}`; }

// =====================================================================
// Starter templates — decorative full-slide background art (as an SVG data URI, so it's crisp
// at any size) plus a small starter deck built from the same real text/shape elements as any
// other slide, so everything the template creates stays fully editable afterward.
// =====================================================================
const WAVES_BG = svgDataUri(`
<svg width="960" height="540" viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">
  <rect width="960" height="540" fill="#F7F8FA"/>
  <g stroke="#E4E7EC" stroke-width="1.5" fill="none" opacity="0.7">
    <path d="M 680,10 C 760,50 840,-10 940,30"/>
    <path d="M 700,40 C 780,80 860,20 960,60"/>
    <path d="M 720,70 C 800,110 880,50 980,90"/>
  </g>
  <g>
    <path d="M -60,-60 C 120,-40 300,70 270,190 C 250,280 90,320 -60,270 Z" fill="#1B3A5C"/>
    <path d="M -60,-40 C 150,0 320,100 280,200 C 255,265 150,290 50,265 C 10,255 -60,235 -60,235 L -60,180 C 40,215 190,215 225,155 C 255,105 120,30 -60,0 Z" fill="#C9A227"/>
  </g>
  <g transform="translate(960,540) rotate(180)">
    <path d="M -60,-60 C 120,-40 300,70 270,190 C 250,280 90,320 -60,270 Z" fill="#1B3A5C"/>
    <path d="M -60,-40 C 150,0 320,100 280,200 C 255,265 150,290 50,265 C 10,255 -60,235 -60,235 L -60,180 C 40,215 190,215 225,155 C 255,105 120,30 -60,0 Z" fill="#C9A227"/>
  </g>
</svg>`);

const CIRCLES_BG = svgDataUri(`
<svg width="960" height="540" viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">
  <rect width="960" height="540" fill="#FBF3E7"/>
  <g>
    <circle cx="20" cy="10" r="90" fill="#6E90B0"/>
    <circle cx="235" cy="0" r="38" fill="#AEC3D8"/>
    <circle cx="275" cy="45" r="42" fill="none" stroke="#6E90B0" stroke-width="3"/>
    <circle cx="10" cy="215" r="34" fill="none" stroke="#AEC3D8" stroke-width="3"/>
    <g fill="#8FA9C4">
      <circle cx="95" cy="150" r="3"/><circle cx="118" cy="141" r="3"/><circle cx="141" cy="133" r="3"/>
      <circle cx="164" cy="127" r="3"/><circle cx="187" cy="123" r="3"/>
      <circle cx="78" cy="176" r="3"/><circle cx="101" cy="168" r="3"/><circle cx="124" cy="160" r="3"/>
      <circle cx="147" cy="154" r="3"/>
      <circle cx="62" cy="202" r="3"/><circle cx="85" cy="194" r="3"/><circle cx="108" cy="187" r="3"/>
    </g>
  </g>
  <g transform="translate(960,540) rotate(180)">
    <circle cx="20" cy="10" r="90" fill="#6E90B0"/>
    <circle cx="235" cy="0" r="38" fill="#AEC3D8"/>
    <circle cx="275" cy="45" r="42" fill="none" stroke="#6E90B0" stroke-width="3"/>
    <circle cx="10" cy="215" r="34" fill="none" stroke="#AEC3D8" stroke-width="3"/>
    <g fill="#8FA9C4">
      <circle cx="95" cy="150" r="3"/><circle cx="118" cy="141" r="3"/><circle cx="141" cy="133" r="3"/>
      <circle cx="164" cy="127" r="3"/><circle cx="187" cy="123" r="3"/>
      <circle cx="78" cy="176" r="3"/><circle cx="101" cy="168" r="3"/><circle cx="124" cy="160" r="3"/>
      <circle cx="147" cy="154" r="3"/>
      <circle cx="62" cy="202" r="3"/><circle cx="85" cy="194" r="3"/><circle cx="108" cy="187" r="3"/>
    </g>
  </g>
</svg>`);

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel dolor ante. Nullam feugiat egestas elit et vehicula. Proin venenatis, orci nec cursus tristique, nulla risus mattis eros, id accumsan massa elit eu augue.';

function wavesSlides(authorName) {
  const navy = '#1B3A5C', gold = '#C9A227';
  const heading = "'Oswald', sans-serif", body = "'Space Mono', monospace";
  const bgSlide = (elements) => ({ id: uid('sl'), background: '#F7F8FA', backgroundImage: WAVES_BG, elements });
  return [
    bgSlide([
      newTextElement({ x: 80, y: 205, width: 800, height: 100, fontSize: 60, align: 'center', bold: true, fontFamily: heading, color: navy, html: '<div>PRESENTATION</div>' }),
      newTextElement({ x: 80, y: 305, width: 800, height: 50, fontSize: 24, align: 'center', fontFamily: body, color: navy, html: `<div>By ${authorName}</div>` }),
    ]),
    bgSlide([
      newTextElement({ x: 300, y: 110, width: 580, height: 80, fontSize: 46, bold: true, fontFamily: heading, color: navy, html: '<div>BACKGROUND</div>' }),
      newTextElement({ x: 300, y: 200, width: 580, height: 220, fontSize: 18, fontFamily: body, color: navy, lineHeight: 1.5, html: `<div>${LOREM}</div>` }),
    ]),
    bgSlide([
      newTextElement({ x: 300, y: 70, width: 580, height: 70, fontSize: 42, bold: true, fontFamily: heading, color: navy, html: '<div>PROJECT GOALS</div>' }),
      newTextElement({ x: 300, y: 165, width: 580, height: 100, fontSize: 18, fontFamily: body, color: navy, lineHeight: 1.4, html: `<div><span style="color:${gold}">&#9654;</span> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel dolor ante.</div>` }),
      newTextElement({ x: 300, y: 290, width: 580, height: 100, fontSize: 18, fontFamily: body, color: navy, lineHeight: 1.4, html: `<div><span style="color:${gold}">&#9654;</span> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel dolor ante.</div>` }),
    ]),
    bgSlide([
      newTextElement({ x: 80, y: 215, width: 800, height: 100, fontSize: 56, align: 'center', bold: true, fontFamily: heading, color: navy, html: '<div>THANK YOU</div>' }),
    ]),
  ];
}

function circlesSlides(authorName) {
  const slate = '#5D7FA0';
  const heading = "'Playfair Display', serif", body = "'Inter', sans-serif";
  const bgSlide = (elements) => ({ id: uid('sl'), background: '#FBF3E7', backgroundImage: CIRCLES_BG, elements });
  const badge = (n) => [
    newShapeElement('rect', { x: 60, y: 460, width: 58, height: 44, fill: slate, borderColor: slate, borderWidth: 0, borderRadius: 4, zIndex: 1 }),
    newTextElement({ x: 60, y: 470, width: 58, height: 30, fontSize: 20, align: 'center', fontFamily: body, color: '#ffffff', zIndex: 2, html: `<div>${n}</div>` }),
  ];
  return [
    bgSlide([
      newTextElement({ x: 80, y: 195, width: 800, height: 110, fontSize: 60, align: 'center', fontFamily: heading, color: slate, html: '<div>Presentation</div>' }),
      newTextElement({ x: 80, y: 310, width: 800, height: 50, fontSize: 22, align: 'center', fontFamily: body, color: slate, html: `<div>By ${authorName}</div>` }),
    ]),
    bgSlide([
      newTextElement({ x: 80, y: 140, width: 560, height: 80, fontSize: 46, fontFamily: heading, color: slate, html: '<div>Introduction</div>' }),
      newTextElement({ x: 80, y: 250, width: 640, height: 180, fontSize: 18, fontFamily: body, color: slate, lineHeight: 1.5, html: `<div>${LOREM}</div>` }),
      ...badge('01'),
    ]),
    bgSlide([
      newTextElement({ x: 80, y: 60, width: 400, height: 70, fontSize: 42, fontFamily: heading, color: slate, html: '<div>Goal</div>' }),
      newTextElement({ x: 80, y: 170, width: 70, height: 70, fontSize: 46, fontFamily: heading, color: slate, html: '<div>1.</div>' }),
      newTextElement({ x: 170, y: 175, width: 280, height: 170, fontSize: 16, fontFamily: body, color: slate, lineHeight: 1.4, html: '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel dolor ante.</div>' }),
      newTextElement({ x: 490, y: 170, width: 70, height: 70, fontSize: 46, fontFamily: heading, color: slate, html: '<div>2.</div>' }),
      newTextElement({ x: 580, y: 175, width: 280, height: 170, fontSize: 16, fontFamily: body, color: slate, lineHeight: 1.4, html: '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel dolor ante.</div>' }),
      ...badge('02'),
    ]),
    bgSlide([
      newTextElement({ x: 80, y: 220, width: 800, height: 100, fontSize: 56, align: 'center', fontFamily: heading, color: slate, html: '<div>Thank you</div>' }),
    ]),
  ];
}

const TEMPLATES = [
  { id: 'blank', name: 'Blank', description: 'Start from an empty slide.', swatch: { background: '#ffffff', border: '1px solid #EFE6DD' }, build: () => [newSlide()] },
  { id: 'waves', name: 'Navy & Gold', description: 'Bold headline style with a navy-and-gold corner motif.', swatch: { background: `#F7F8FA url("${WAVES_BG}") center/cover` }, build: (authorName) => wavesSlides(authorName) },
  { id: 'circles', name: 'Cream & Blue', description: 'Elegant serif style with a soft scattered-circle motif.', swatch: { background: `#FBF3E7 url("${CIRCLES_BG}") center/cover` }, build: (authorName) => circlesSlides(authorName) },
];

function slidePreviewLabel(slide) {
  const firstText = (slide.elements || []).find(e => e.type === 'text' && stripHtml(e.html));
  return firstText ? stripHtml(firstText.html).slice(0, 60) : 'Slide';
}

// =====================================================================
// Responsive scale: slides render at a fixed 960x540 design size, then scale via CSS transform
// to fit whatever container hosts them (the editor card, or the fullscreen present overlay) —
// one geometry model, correct everywhere.
// =====================================================================
function useSlideScale(containerRef) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setScale(Math.min(width / DESIGN_W, height / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);
  return scale;
}

// =====================================================================
// One element on the canvas: drag to move (via a small grip handle for text, whole body for
// image/shape), corner handles to resize, single click to select.
// =====================================================================
function ElementBox({ element: el, editable, selected, scale, onSelect, onChange, registerEditableRef }) {
  const dragState = useRef(null);

  const commitPatch = (patch) => onChange(el.id, patch, false);
  const commitPatchFinal = (patch) => onChange(el.id, patch, true);

  // Force any other text box's pending edit to commit (via blur) before this drag/resize can
  // touch shared slide state — otherwise a re-render mid-drag could reset that box back to its
  // last-committed html, discarding whatever was typed since.
  const commitOtherEdits = () => {
    if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
  };

  const startDrag = (e) => {
    if (!editable) return;
    e.stopPropagation();
    commitOtherEdits();
    onSelect(el.id);
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  };

  const startResize = (corner) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    commitOtherEdits();
    onSelect(el.id);
    dragState.current = { mode: 'resize', corner, startX: e.clientX, startY: e.clientY, orig: { x: el.x, y: el.y, width: el.width, height: el.height } };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  };

  const onDragMove = (e) => {
    const st = dragState.current;
    if (!st) return;
    const dx = (e.clientX - st.startX) / (scale || 1);
    const dy = (e.clientY - st.startY) / (scale || 1);
    if (st.mode === 'move') {
      commitPatch({ x: clamp(st.origX + dx, -DESIGN_W, DESIGN_W * 2), y: clamp(st.origY + dy, -DESIGN_H, DESIGN_H * 2) });
    } else {
      const o = st.orig;
      let { x, y, width, height } = o;
      if (st.corner.includes('e')) width = clamp(o.width + dx, 24, DESIGN_W * 2);
      if (st.corner.includes('s')) height = clamp(o.height + dy, 24, DESIGN_H * 2);
      if (st.corner.includes('w')) { width = clamp(o.width - dx, 24, DESIGN_W * 2); x = o.x + (o.width - width); }
      if (st.corner.includes('n')) { height = clamp(o.height - dy, 24, DESIGN_H * 2); y = o.y + (o.height - height); }
      commitPatch({ x, y, width, height });
    }
  };

  const onDragEnd = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    commitPatchFinal({});
  };

  useEffect(() => () => {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperStyle = {
    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
    zIndex: el.zIndex || 1,
    outline: selected && editable ? '2px solid var(--dc-accent)' : 'none',
    outlineOffset: '2px',
    cursor: editable && el.type !== 'text' ? 'move' : 'default',
  };

  return (
    <div
      style={wrapperStyle}
      onMouseDown={el.type !== 'text' ? startDrag : (e) => { e.stopPropagation(); onSelect(el.id); }}
    >
      {el.type === 'text' && (
        <div
          className="dc-el-content"
          ref={(node) => { if (selected) registerEditableRef(node); }}
          contentEditable={editable}
          suppressContentEditableWarning
          key={el.id}
          dangerouslySetInnerHTML={{ __html: el.html }}
          onBlur={(e) => commitPatchFinal({ html: e.currentTarget.innerHTML })}
          style={{
            width: '100%', height: '100%', boxSizing: 'border-box', padding: '4px',
            fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, color: el.color,
            fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? 'italic' : 'normal',
            textDecoration: el.underline ? 'underline' : 'none', textAlign: el.align,
            lineHeight: el.lineHeight, overflow: 'hidden', outline: 'none', cursor: editable ? 'text' : 'default',
          }}
        />
      )}
      {el.type === 'image' && (
        el.src ? (
          <img
            src={el.src} alt={el.alt || ''} draggable={false} onDragStart={(e) => e.preventDefault()}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: `${el.borderRadius || 0}px`, display: 'block', pointerEvents: 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3EEE8', color: 'var(--dc-muted)', fontSize: '13px', borderRadius: `${el.borderRadius || 0}px`, border: '1.5px dashed var(--dc-border)', boxSizing: 'border-box' }}>
            🖼 Image
          </div>
        )
      )}
      {el.type === 'shape' && (
        <div style={{
          width: '100%', height: '100%', background: el.fill,
          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
          borderRadius: el.shape === 'ellipse' ? '50%' : `${el.borderRadius || 0}px`, boxSizing: 'border-box',
        }} />
      )}

      {selected && editable && (
        <>
          {el.type === 'text' && (
            <div
              onMouseDown={startDrag}
              title="Drag to move"
              style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '18px', background: 'var(--dc-accent)', borderRadius: '5px', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', userSelect: 'none' }}
            >
              ⠿
            </div>
          )}
          {['nw', 'ne', 'sw', 'se'].map(corner => (
            <div
              key={corner}
              onMouseDown={startResize(corner)}
              style={{
                position: 'absolute', width: '11px', height: '11px', background: '#fff', border: '2px solid var(--dc-accent)', borderRadius: '3px',
                top: corner.includes('n') ? '-6px' : 'auto', bottom: corner.includes('s') ? '-6px' : 'auto',
                left: corner.includes('w') ? '-6px' : 'auto', right: corner.includes('e') ? '-6px' : 'auto',
                cursor: (corner === 'nw' || corner === 'se') ? 'nwse-resize' : 'nesw-resize',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// =====================================================================
// Slide canvas — the fixed 960x540 design surface, scaled to fit its container.
// =====================================================================
function SlideCanvas({ slide, editable, selectedElementId, onSelectElement, onUpdateElement, registerEditableRef, containerStyle }) {
  const containerRef = useRef(null);
  const scale = useSlideScale(containerRef);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...containerStyle }}>
      <div
        onMouseDown={() => editable && onSelectElement(null)}
        style={{
          width: DESIGN_W, height: DESIGN_H, flexShrink: 0, position: 'relative', transform: `scale(${scale})`,
          background: slide.background || '#fff',
          backgroundImage: slide.backgroundImage ? `url("${slide.backgroundImage}")` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        {(slide.elements || []).map(el => (
          <ElementBox
            key={el.id}
            element={el}
            editable={editable}
            selected={editable && el.id === selectedElementId}
            scale={scale}
            onSelect={onSelectElement}
            onChange={onUpdateElement}
            registerEditableRef={registerEditableRef}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// Rich text toolbar — box-level defaults (font/size/color/weight/style/align/line-height) always
// apply; if the user has an actual text selection inside the box, the same action is also run via
// document.execCommand so it applies just to that selection, like a real word processor.
// =====================================================================
function TextFormatToolbar({ element: el, onUpdateElement, editableElRef, lastRangeRef }) {
  const focusAndMaybeRestore = () => {
    const node = editableElRef.current;
    if (!node) return null;
    const sel = window.getSelection();
    const alreadyInside = sel.rangeCount && node.contains(sel.anchorNode) && !sel.isCollapsed;
    if (!alreadyInside) {
      node.focus();
      if (lastRangeRef.current && node.contains(lastRangeRef.current.startContainer)) {
        sel.removeAllRanges();
        sel.addRange(lastRangeRef.current);
      }
    }
    return window.getSelection();
  };

  const hasRealSelection = () => {
    const node = editableElRef.current;
    if (!node) return false;
    const sel = window.getSelection();
    return sel.rangeCount > 0 && !sel.isCollapsed && node.contains(sel.anchorNode) && node.contains(sel.focusNode);
  };

  const commitFromDom = () => {
    const node = editableElRef.current;
    if (node) onUpdateElement(el.id, { html: node.innerHTML }, true);
  };

  // Any box-default change (font/size/color/weight/align/...) is applied via onUpdateElement,
  // which re-renders this element with a dangerouslySetInnerHTML tied to state.html. That state
  // only otherwise updates on the contentEditable's blur — which isn't guaranteed to have fired
  // yet (e.g. a <select>'s change can land without a genuine blur in some browsers/automation),
  // so every box-default patch also snapshots the live DOM's current innerHTML alongside it,
  // never trusting a possibly-stale state.html to still match what's on screen.
  const syncedPatch = (patch) => {
    const node = editableElRef.current;
    return node ? { ...patch, html: node.innerHTML } : patch;
  };

  const runExecIfSelected = (cmd, value) => {
    const node = editableElRef.current;
    if (!node) return;
    const sel = focusAndMaybeRestore();
    const selected = sel && sel.rangeCount > 0 && !sel.isCollapsed && node.contains(sel.anchorNode);
    if (selected) {
      document.execCommand(cmd, false, value);
      commitFromDom();
    }
  };

  const toggleBold = () => { onUpdateElement(el.id, syncedPatch({ bold: !el.bold }), true); runExecIfSelected('bold'); };
  const toggleItalic = () => { onUpdateElement(el.id, syncedPatch({ italic: !el.italic }), true); runExecIfSelected('italic'); };
  const toggleUnderline = () => { onUpdateElement(el.id, syncedPatch({ underline: !el.underline }), true); runExecIfSelected('underline'); };
  const setAlign = (align) => {
    onUpdateElement(el.id, syncedPatch({ align }), true);
    const cmd = align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : align === 'justify' ? 'justifyFull' : 'justifyLeft';
    runExecIfSelected(cmd);
  };
  const setFontFamily = (value) => { onUpdateElement(el.id, syncedPatch({ fontFamily: value }), true); runExecIfSelected('fontName', value); };
  const setColor = (value) => { onUpdateElement(el.id, syncedPatch({ color: value }), true); runExecIfSelected('foreColor', value); };
  const setFontSize = (px) => {
    onUpdateElement(el.id, syncedPatch({ fontSize: px }), true);
    if (hasRealSelection()) {
      const node = editableElRef.current;
      focusAndMaybeRestore();
      document.execCommand('fontSize', false, '7');
      node.querySelectorAll('font[size="7"]').forEach(f => { f.removeAttribute('size'); f.style.fontSize = `${px}px`; });
      commitFromDom();
    }
  };
  const insertList = (ordered) => {
    const node = editableElRef.current;
    if (!node) return;
    focusAndMaybeRestore();
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
    commitFromDom();
  };
  const setLineHeight = (v) => onUpdateElement(el.id, syncedPatch({ lineHeight: v }), true);

  const btnMouseDown = (e) => e.preventDefault();

  return (
    <>
      <label className="dc-field-label">Font</label>
      <select className="dc-field-input" value={el.fontFamily} onMouseDown={() => { const s = window.getSelection(); if (s.rangeCount && !s.isCollapsed) lastRangeRef.current = s.getRangeAt(0); }} onChange={e => setFontFamily(e.target.value)}>
        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <label className="dc-field-label">Size</label>
      <input type="number" min={8} max={200} className="dc-field-input" value={el.fontSize}
        onMouseDown={() => { const s = window.getSelection(); if (s.rangeCount && !s.isCollapsed) lastRangeRef.current = s.getRangeAt(0); }}
        onChange={e => setFontSize(clamp(parseInt(e.target.value, 10) || 1, 8, 200))} />

      <label className="dc-field-label">Text color</label>
      <input type="color" className="dc-field-input" style={{ height: '34px', padding: '2px', cursor: 'pointer' }} value={el.color}
        onMouseDown={() => { const s = window.getSelection(); if (s.rangeCount && !s.isCollapsed) lastRangeRef.current = s.getRangeAt(0); }}
        onChange={e => setColor(e.target.value)} />

      <label className="dc-field-label">Style</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className={`dc-tbtn${el.bold ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={toggleBold} title="Bold"><b>B</b></button>
        <button className={`dc-tbtn${el.italic ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={toggleItalic} title="Italic"><i>I</i></button>
        <button className={`dc-tbtn${el.underline ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={toggleUnderline} title="Underline"><u>U</u></button>
      </div>

      <label className="dc-field-label">Alignment</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className={`dc-tbtn${el.align === 'left' ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={() => setAlign('left')} title="Align left">⯇</button>
        <button className={`dc-tbtn${el.align === 'center' ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={() => setAlign('center')} title="Align center">☰</button>
        <button className={`dc-tbtn${el.align === 'right' ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={() => setAlign('right')} title="Align right">⯈</button>
        <button className={`dc-tbtn${el.align === 'justify' ? ' active' : ''}`} onMouseDown={btnMouseDown} onClick={() => setAlign('justify')} title="Justify">▤</button>
      </div>

      <label className="dc-field-label">List</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="dc-tbtn" onMouseDown={btnMouseDown} onClick={() => insertList(false)} title="Bullet list">• ≡</button>
        <button className="dc-tbtn" onMouseDown={btnMouseDown} onClick={() => insertList(true)} title="Numbered list">1. ≡</button>
      </div>

      <label className="dc-field-label">Line spacing</label>
      <select className="dc-field-input" value={el.lineHeight} onChange={e => setLineHeight(parseFloat(e.target.value))}>
        <option value={1}>Single</option>
        <option value={1.15}>1.15</option>
        <option value={1.3}>1.3</option>
        <option value={1.5}>1.5</option>
        <option value={2}>Double</option>
      </select>
    </>
  );
}

// =====================================================================
// Right-hand inspector: text formatting toolbar, image/shape props, or (nothing selected)
// slide-level background — plus common layering / duplicate / delete actions.
// =====================================================================
function Inspector({ slide, selectedElement, onUpdateElement, onUpdateSlide, editableElRef, lastRangeRef, onLayer, onDeleteElement, onDuplicateElement, onDuplicateSlide, onDeleteSlide, canDeleteSlide }) {
  if (!selectedElement) {
    return (
      <>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dc-ink)' }}>Slide</h3>
        <label className="dc-field-label">Background color</label>
        <input type="color" className="dc-field-input" style={{ height: '34px', padding: '2px', cursor: 'pointer' }} value={slide.background || '#ffffff'} onChange={e => onUpdateSlide({ background: e.target.value })} />
        {slide.backgroundImage && (
          <button className="dc-btn-outline" style={{ width: '100%', padding: '8px', fontSize: '0.78rem', marginTop: '10px' }} onClick={() => onUpdateSlide({ backgroundImage: '' })}>Remove decorative background</button>
        )}
        <p style={{ color: 'var(--dc-muted)', fontSize: '0.8rem', marginTop: '14px' }}>Click an element to edit it, or use the Insert bar above the slide to add text, images or shapes.</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', borderTop: '1px solid var(--dc-border)', paddingTop: '14px' }}>
          <button className="dc-btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }} onClick={onDuplicateSlide}>Duplicate slide</button>
          <button className="dc-btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.78rem', color: '#D93025' }} onClick={onDeleteSlide} disabled={!canDeleteSlide}>Delete slide</button>
        </div>
      </>
    );
  }

  const el = selectedElement;
  return (
    <>
      <h3 style={{ margin: '0 0 14px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dc-ink)' }}>
        {el.type === 'text' ? '🔤 Text' : el.type === 'image' ? '🖼️ Image' : el.shape === 'ellipse' ? '⬤ Circle' : '▭ Rectangle'}
      </h3>

      {el.type === 'text' && (
        <TextFormatToolbar element={el} onUpdateElement={onUpdateElement} editableElRef={editableElRef} lastRangeRef={lastRangeRef} />
      )}

      {el.type === 'image' && (
        <>
          <label className="dc-field-label">Image URL</label>
          <input className="dc-field-input" value={el.src} onChange={e => onUpdateElement(el.id, { src: e.target.value }, true)} placeholder="https://…" />
          <label className="dc-field-label">Alt text</label>
          <input className="dc-field-input" value={el.alt} onChange={e => onUpdateElement(el.id, { alt: e.target.value }, true)} placeholder="Describe the image" />
          <label className="dc-field-label">Corner radius</label>
          <input type="range" min={0} max={120} className="dc-field-input" value={el.borderRadius} onChange={e => onUpdateElement(el.id, { borderRadius: parseInt(e.target.value, 10) }, true)} />
        </>
      )}

      {el.type === 'shape' && (
        <>
          <label className="dc-field-label">Fill color</label>
          <input type="color" className="dc-field-input" style={{ height: '34px', padding: '2px', cursor: 'pointer' }} value={el.fill} onChange={e => onUpdateElement(el.id, { fill: e.target.value }, true)} />
          <label className="dc-field-label">Border color</label>
          <input type="color" className="dc-field-input" style={{ height: '34px', padding: '2px', cursor: 'pointer' }} value={el.borderColor} onChange={e => onUpdateElement(el.id, { borderColor: e.target.value }, true)} />
          <label className="dc-field-label">Border width</label>
          <input type="range" min={0} max={20} className="dc-field-input" value={el.borderWidth} onChange={e => onUpdateElement(el.id, { borderWidth: parseInt(e.target.value, 10) }, true)} />
          {el.shape === 'rect' && (
            <>
              <label className="dc-field-label">Corner radius</label>
              <input type="range" min={0} max={120} className="dc-field-input" value={el.borderRadius} onChange={e => onUpdateElement(el.id, { borderRadius: parseInt(e.target.value, 10) }, true)} />
            </>
          )}
        </>
      )}

      <label className="dc-field-label">Layer order</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="dc-btn-outline" style={{ flex: 1, padding: '7px', fontSize: '0.75rem' }} onClick={() => onLayer(el.id, 'front')}>Bring to front</button>
        <button className="dc-btn-outline" style={{ flex: 1, padding: '7px', fontSize: '0.75rem' }} onClick={() => onLayer(el.id, 'back')}>Send to back</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '18px', borderTop: '1px solid var(--dc-border)', paddingTop: '14px' }}>
        <button className="dc-btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }} onClick={() => onDuplicateElement(el.id)}>Duplicate</button>
        <button className="dc-btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.78rem', color: '#D93025' }} onClick={() => onDeleteElement(el.id)}>Delete</button>
      </div>
    </>
  );
}

// =====================================================================
// Editor
// =====================================================================
function DocreateEditor({ presentation, onBack, onSaved }) {
  const [title, setTitle] = useState(presentation.title);
  const [slides, setSlides] = useState(presentation.slides && presentation.slides.length ? presentation.slides : [newSlide()]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const editableElRef = useRef(null);
  const lastRangeRef = useRef(null);
  const registerEditableRef = useCallback((node) => { if (node) editableElRef.current = node; }, []);

  const commitActiveEdit = () => {
    if (editableElRef.current && document.activeElement === editableElRef.current) {
      editableElRef.current.blur();
    }
  };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/presentations/${presentation.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, slides })
      });
      const data = await res.json();
      if (res.ok) { setDirty(false); onSaved?.(data); }
    } catch { /* keep local state; try again on next change */ }
    finally { setSaving(false); }
  }, [presentation.id, title, slides, onSaved]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(save, 1000);
    return () => clearTimeout(t);
  }, [dirty, save]);

  const selectSlide = (i) => {
    commitActiveEdit();
    setSelectedIndex(i);
    setSelectedElementId(null);
  };

  const selectElement = (id) => setSelectedElementId(id);

  const updateSlideBackground = (patch) => {
    setSlides(prev => prev.map((s, i) => i === selectedIndex ? { ...s, ...patch } : s));
    setDirty(true);
  };

  const updateElement = (elementId, patch, final) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== selectedIndex) return s;
      return { ...s, elements: s.elements.map(e => e.id === elementId ? { ...e, ...patch } : e) };
    }));
    if (final) setDirty(true);
  };

  const addElement = (kind) => {
    const slide = slides[selectedIndex];
    const maxZ = Math.max(0, ...slide.elements.map(e => e.zIndex || 1));
    let el;
    if (kind === 'text') el = newTextElement({ zIndex: maxZ + 1 });
    else if (kind === 'image') el = newImageElement({ zIndex: maxZ + 1 });
    else el = newShapeElement(kind, { zIndex: maxZ + 1 });
    setSlides(prev => prev.map((s, i) => i === selectedIndex ? { ...s, elements: [...s.elements, el] } : s));
    setSelectedElementId(el.id);
    setDirty(true);
  };

  const layerElement = (elementId, dir) => {
    const slide = slides[selectedIndex];
    const zs = slide.elements.map(e => e.zIndex || 1);
    const target = dir === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
    updateElement(elementId, { zIndex: target }, true);
  };

  const deleteElement = (elementId) => {
    setSlides(prev => prev.map((s, i) => i === selectedIndex ? { ...s, elements: s.elements.filter(e => e.id !== elementId) } : s));
    setSelectedElementId(null);
    setDirty(true);
  };

  const duplicateElement = (elementId) => {
    const slide = slides[selectedIndex];
    const src = slide.elements.find(e => e.id === elementId);
    if (!src) return;
    const maxZ = Math.max(0, ...slide.elements.map(e => e.zIndex || 1));
    const copy = { ...src, id: uid('el'), x: src.x + 20, y: src.y + 20, zIndex: maxZ + 1 };
    setSlides(prev => prev.map((s, i) => i === selectedIndex ? { ...s, elements: [...s.elements, copy] } : s));
    setSelectedElementId(copy.id);
    setDirty(true);
  };

  const addSlide = () => {
    commitActiveEdit();
    const s = newSlide();
    setSlides(prev => { const next = [...prev]; next.splice(selectedIndex + 1, 0, s); return next; });
    setSelectedIndex(selectedIndex + 1);
    setSelectedElementId(null);
    setDirty(true);
  };

  const duplicateSlide = () => {
    const copy = { ...slides[selectedIndex], id: uid('sl'), elements: slides[selectedIndex].elements.map(e => ({ ...e, id: uid('el') })) };
    setSlides(prev => { const next = [...prev]; next.splice(selectedIndex + 1, 0, copy); return next; });
    setDirty(true);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(i => Math.max(0, Math.min(i, slides.length - 2)));
    setSelectedElementId(null);
    setDirty(true);
  };

  const moveSlide = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    setSlides(prev => { const next = [...prev]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    setSelectedIndex(target);
    setDirty(true);
  };

  const openPresent = () => { commitActiveEdit(); setPresentIndex(selectedIndex); setPresenting(true); };

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setPresentIndex(i => Math.min(slides.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setPresentIndex(i => Math.max(0, i - 1));
      else if (e.key === 'Escape') setPresenting(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, slides.length]);

  useEffect(() => {
    if (selectedElementId === null) return;
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement !== editableElRef.current) {
        e.preventDefault();
        deleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementId, selectedIndex]);

  const selectedSlide = slides[selectedIndex];
  const selectedElement = selectedSlide?.elements?.find(e => e.id === selectedElementId) || null;

  if (presenting) {
    const pSlide = slides[presentIndex];
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 100 }}>
        <button
          onClick={() => setPresenting(false)}
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: '999px', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          ✕
        </button>
        <SlideCanvas slide={pSlide} editable={false} selectedElementId={null} onSelectElement={() => {}} onUpdateElement={() => {}} registerEditableRef={() => {}} />
        <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>{presentIndex + 1} / {slides.length}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--dc-surface)' }}>
      <header style={{ height: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '0 18px', background: '#fff', borderBottom: '1px solid var(--dc-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button onClick={onBack} title="Back to presentations" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--dc-muted)', padding: '4px' }}>←</button>
          <div style={{ width: '24px', height: '24px', flexShrink: 0 }}><LogoDocreate /></div>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setDirty(true); }}
            style={{ border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 700, color: 'var(--dc-ink)', fontFamily: "'Inter', sans-serif", background: 'transparent', minWidth: 0, width: '260px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--dc-muted)', fontWeight: 600 }}>{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</span>
          <button className="dc-btn-outline" onClick={openPresent}>▶ Present</button>
          <button className="dc-btn-primary" onClick={() => { commitActiveEdit(); save(); }} disabled={saving}>Save</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Slide list */}
        <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid var(--dc-border)', background: '#fff', overflowY: 'auto', padding: '14px 10px' }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              onClick={() => selectSlide(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '10px', cursor: 'pointer', marginBottom: '6px',
                background: i === selectedIndex ? 'var(--dc-accent-soft)' : 'transparent',
                border: i === selectedIndex ? '1px solid #FCD3AE' : '1px solid transparent'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--dc-muted)', width: '16px', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--dc-ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{slidePreviewLabel(s)}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <button onClick={e => { e.stopPropagation(); moveSlide(i, -1); }} disabled={i === 0} title="Move up" style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.6rem', color: 'var(--dc-muted)', opacity: i === 0 ? 0.3 : 1, padding: 0 }}>▲</button>
                <button onClick={e => { e.stopPropagation(); moveSlide(i, 1); }} disabled={i === slides.length - 1} title="Move down" style={{ background: 'none', border: 'none', cursor: i === slides.length - 1 ? 'default' : 'pointer', fontSize: '0.6rem', color: 'var(--dc-muted)', opacity: i === slides.length - 1 ? 0.3 : 1, padding: 0 }}>▼</button>
              </div>
            </div>
          ))}
          <button className="dc-btn-outline" style={{ width: '100%', padding: '9px', fontSize: '0.8rem', marginTop: '8px' }} onClick={addSlide}>+ Add slide</button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="dc-insert-btn" onClick={() => addElement('text')}><span style={{ fontSize: '1rem' }}>🔤</span>Text</button>
            <button className="dc-insert-btn" onClick={() => addElement('image')}><span style={{ fontSize: '1rem' }}>🖼️</span>Image</button>
            <button className="dc-insert-btn" onClick={() => addElement('rect')}><span style={{ fontSize: '1rem' }}>▭</span>Rectangle</button>
            <button className="dc-insert-btn" onClick={() => addElement('ellipse')}><span style={{ fontSize: '1rem' }}>⬤</span>Circle</button>
          </div>
          <div style={{ width: '100%', maxWidth: '860px', aspectRatio: '16 / 9', borderRadius: '10px', border: '1px solid var(--dc-border)', boxShadow: '0 12px 32px -16px rgba(36,27,20,0.3)', overflow: 'hidden' }}>
            <SlideCanvas
              slide={selectedSlide}
              editable
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              registerEditableRef={registerEditableRef}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="dc-btn-outline" style={{ padding: '6px 12px' }} disabled={selectedIndex === 0} onClick={() => selectSlide(selectedIndex - 1)}>‹</button>
            <span style={{ fontSize: '0.78rem', color: 'var(--dc-muted)', fontWeight: 600 }}>{selectedIndex + 1} / {slides.length}</span>
            <button className="dc-btn-outline" style={{ padding: '6px 12px' }} disabled={selectedIndex === slides.length - 1} onClick={() => selectSlide(selectedIndex + 1)}>›</button>
          </div>
        </div>

        {/* Inspector */}
        <div style={{ width: '260px', flexShrink: 0, borderLeft: '1px solid var(--dc-border)', background: '#fff', padding: '18px', overflowY: 'auto' }}>
          <Inspector
            slide={selectedSlide}
            selectedElement={selectedElement}
            onUpdateElement={updateElement}
            onUpdateSlide={updateSlideBackground}
            editableElRef={editableElRef}
            lastRangeRef={lastRangeRef}
            onLayer={layerElement}
            onDeleteElement={deleteElement}
            onDuplicateElement={duplicateElement}
            onDuplicateSlide={duplicateSlide}
            onDeleteSlide={deleteSlide}
            canDeleteSlide={slides.length > 1}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Dashboard
// =====================================================================
function DocreateDashboard({ currentUser, onOpen, onHome, userRole, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const fetchPresentations = useCallback(() => {
    fetch('/api/presentations', { headers: { ...authHeaders() } })
      .then(async res => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(data => { setPresentations(Array.isArray(data) ? data : []); setLoadError(''); })
      .catch(err => setLoadError(err.message || 'Could not load your presentations.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPresentations(); }, [fetchPresentations]);

  const createPresentation = async (templateId) => {
    const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    setShowTemplatePicker(false);
    setCreating(true);
    try {
      const res = await fetch('/api/presentations', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: template.id === 'blank' ? 'Untitled presentation' : `${template.name} presentation`,
          slides: template.build(currentUser?.name || 'Your Name')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) {
      alert(err.message || 'Could not create the presentation.');
    } finally {
      setCreating(false);
    }
  };

  const deletePresentation = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await fetch(`/api/presentations/${p.id}`, { method: 'DELETE', headers: { ...authHeaders() } });
      setPresentations(prev => prev.filter(x => x.id !== p.id));
    } catch { /* ignore */ }
  };

  const openPresentation = async (p) => {
    try {
      const res = await fetch(`/api/presentations/${p.id}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) {
      alert(err.message || 'Could not open this presentation.');
    }
  };

  return (
    <div className="module-view-container" style={{ background: 'var(--dc-bg)' }}>
      <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--dc-border)' }}>
        <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Back to home">
          <div style={{ width: '28px', height: '28px' }}><LogoDocreate /></div>
          <span style={{ color: 'var(--dc-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>Docreate</span>
        </div>
        <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
      </header>

      <div className="dc-scroll">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--dc-ink)', fontFamily: "'Inter', sans-serif" }}>Your presentations</h1>
              <p style={{ margin: 0, color: 'var(--dc-muted)', fontSize: '0.85rem' }}>Drag-and-drop text, images and shapes — design each slide freely.</p>
            </div>
            <button className="dc-btn-primary" onClick={() => setShowTemplatePicker(true)} disabled={creating}>+ New presentation</button>
          </div>

          {loading ? (
            <div className="dc-card" style={{ textAlign: 'center', color: 'var(--dc-muted)', padding: '40px' }}>Loading…</div>
          ) : loadError ? (
            <div className="dc-card" style={{ textAlign: 'center', color: '#D93025', padding: '40px' }}>{loadError}</div>
          ) : presentations.length === 0 ? (
            <div className="dc-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoDocreate /></div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--dc-ink)', fontSize: '1.15rem' }}>No presentations yet</h2>
              <p style={{ color: 'var(--dc-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>Create your first deck — drag text, images and shapes anywhere on the slide.</p>
              <button className="dc-btn-primary" onClick={() => setShowTemplatePicker(true)} disabled={creating}>+ New presentation</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {presentations.map(p => (
                <div key={p.id} className="dc-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={() => openPresentation(p)}>
                  <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'var(--dc-accent-soft)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '32px', height: '32px' }}><LogoDocreate /></div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--dc-ink)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dc-muted)', marginTop: '2px' }}>{p.slideCount} {p.slideCount === 1 ? 'slide' : 'slides'}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deletePresentation(p); }}
                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: 0 }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTemplatePicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(36,27,20,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowTemplatePicker(false)}>
          <div className="dc-card" style={{ width: '100%', maxWidth: '760px', maxHeight: '85vh', overflowY: 'auto', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dc-ink)' }}>Choose a starting point</h2>
              <button onClick={() => setShowTemplatePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--dc-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => createPresentation(t.id)} style={{ cursor: 'pointer', border: '1px solid var(--dc-border)', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.15s ease, border-color 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px -10px rgba(36,27,20,0.25)'; e.currentTarget.style.borderColor = '#E0D2C4'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--dc-border)'; }}
                >
                  <div style={{ width: '100%', aspectRatio: '16 / 9', ...t.swatch }} />
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--dc-ink)', fontSize: '0.88rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dc-muted)', marginTop: '2px' }}>{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Top level
// =====================================================================
export default function DocreateView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [openPresentation, setOpenPresentation] = useState(null);
  const isLoggedIn = !!currentUser;

  if (!isLoggedIn) {
    return (
      <div className="module-view-container" style={{ background: 'var(--dc-bg)' }}>
        <style>{DC_CSS}</style>
        <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--dc-border)' }}>
          <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Back to home">
            <div style={{ width: '28px', height: '28px' }}><LogoDocreate /></div>
            <span style={{ color: 'var(--dc-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>Docreate</span>
          </div>
          <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dc-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '420px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoDocreate /></div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--dc-ink)', fontSize: '1.25rem' }}>Welcome to Docreate</h2>
            <p style={{ color: 'var(--dc-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Design presentations freely — drag text, images and shapes anywhere on the slide. Sign in to get started.
            </p>
            <button className="dc-btn-primary" onClick={onOpenAuthModal}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  if (openPresentation) {
    return (
      <>
        <style>{DC_CSS}</style>
        <DocreateEditor
          presentation={openPresentation}
          onBack={() => setOpenPresentation(null)}
          onSaved={setOpenPresentation}
        />
      </>
    );
  }

  return (
    <>
      <style>{DC_CSS}</style>
      <DocreateDashboard
        currentUser={currentUser}
        onOpen={setOpenPresentation}
        onHome={onHome}
        userRole={userRole}
        setCurrentUser={setCurrentUser}
        onOpenAuthModal={onOpenAuthModal}
        onOpenAvatarPicker={onOpenAvatarPicker}
      />
    </>
  );
}
