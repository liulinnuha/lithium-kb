let graphData = window.__INITIAL_DATA__?.graph || { nodes: [], links: [] };
let currentMarkdown = window.__INITIAL_DATA__?.markdown || '';
let currentDocName = 'PROJECT_KB.md';
let structuredDocs = window.__INITIAL_DATA__?.docs || {};
let tokensSaved = window.__INITIAL_DATA__?.cumulativeTokensSaved || 4250;

const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

let nodes = [];
let links = [];
let pulses = [];
let width = 0, height = 0;
let hoveredNode = null;
let draggedNode = null;
let offset = { x: 0, y: 0 };
let scale = 1.0;
let isDraggingCanvas = false;
let dragStart = { x: 0, y: 0 };

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initGraphData() {
  const nodeMap = new Map();
  nodes = graphData.nodes.map((n, i) => {
    const angle = (i / (graphData.nodes.length || 1)) * Math.PI * 2;
    const radius = n.group === 'core' ? 0 : (n.group === 'category' ? 140 : 250);
    const obj = {
      ...n,
      x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
      y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      radius: n.group === 'core' ? 22 : (n.group === 'category' ? 15 : 9),
      pulseVal: 0
    };
    nodeMap.set(n.id, obj);
    return obj;
  });

  links = graphData.links.map(l => ({
    source: nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source),
    target: nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target)
  })).filter(l => l.source && l.target);

  updateDocCount();
}

function updateDocCount() {
  let count = 0;
  for (const items of Object.values(structuredDocs)) {
    if (Array.isArray(items)) count += items.length;
  }
  const badge = document.getElementById('docCountBadge');
  if (badge) badge.innerText = `${count} docs`;
}

export function renderKbTree(filter = '') {
  const container = document.getElementById('kbTreeContainer');
  if (!container) return;

  const f = filter.toLowerCase().trim();
  let html = '';

  if (!f || 'project_kb.md'.includes(f) || 'index'.includes(f)) {
    html += '<button type="button" class="kb-tree-item active" id="kb-item-root">📄 PROJECT_KB.md (Index)</button>';
  }

  const catIcons = { architecture: '📁', debug: '🐛', tasks: '📋', features: '✨' };

  for (const [cat, items] of Object.entries(structuredDocs)) {
    const matchingDocs = items ? items.filter(d => !f || d.filename.toLowerCase().includes(f) || cat.includes(f) || (d.title && d.title.toLowerCase().includes(f))) : [];

    if (!f || matchingDocs.length > 0 || cat.includes(f)) {
      html += `<div class="kb-tree-category">${catIcons[cat] || '📁'} ${cat}/</div>`;
      if (matchingDocs.length > 0) {
        for (const doc of matchingDocs) {
          html += `<button type="button" class="kb-tree-item" data-path="${doc.relPath}">📄 ${doc.filename}</button>`;
        }
      } else if (!f) {
        html += '<div style="font-size:0.75rem; color:var(--muted); margin-left:1rem;">(empty)</div>';
      }
    }
  }

  if (!html) {
    html = '<div style="font-size:0.78rem; color:var(--muted); padding:0.5rem;">No matching documents found.</div>';
  }

  container.innerHTML = html;

  // Add event listeners
  document.getElementById('kb-item-root')?.addEventListener('click', function() {
    document.querySelectorAll('.kb-tree-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    loadMainIndex();
  });

  container.querySelectorAll('.kb-tree-item[data-path]').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.kb-tree-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      loadDoc(this.getAttribute('data-path'));
    });
  });
}

export function filterKbTree(query) {
  renderKbTree(query);
}

export async function loadDoc(relPath) {
  try {
    const res = await fetch('/api/doc?path=' + encodeURIComponent(relPath));
    const data = await res.json();
    currentMarkdown = data.content;
    currentDocName = relPath;
    renderDocs();
    switchView('doc', document.getElementById('tab-btn-doc'));
    showToast('Viewing ' + relPath.split(/[\/\\]/).pop());
  } catch {
    showToast('Failed to load doc');
  }
}

export function loadMainIndex() {
  fetch('/api/kb').then(r => r.json()).then(d => {
    currentMarkdown = d.markdown;
    currentDocName = 'PROJECT_KB.md';
    renderDocs();
    switchView('doc', document.getElementById('tab-btn-doc'));
  });
}

export function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = canvas.width = rect.width;
  height = canvas.height = rect.height;
  if (nodes.length === 0) initGraphData();
}

export function zoomIn() {
  scale = Math.min(scale * 1.25, 2.8);
  showToast(`Zoom: ${Math.round(scale * 100)}%`);
}

export function zoomOut() {
  scale = Math.max(scale / 1.25, 0.4);
  showToast(`Zoom: ${Math.round(scale * 100)}%`);
}

export function resetGraph() {
  offset = { x: 0, y: 0 };
  scale = 1.0;
  initGraphData();
  showToast('Graph centered');
}

function stepPhysics() {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < nodes.length; i++) {
    const n1 = nodes[i];
    if (n1 === draggedNode) continue;

    n1.vx += (cx - n1.x) * 0.001;
    n1.vy += (cy - n1.y) * 0.001;

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.hypot(dx, dy) || 1;
      const minDist = n1.radius + n2.radius + 40;
      if (dist < minDist * 2) {
        const force = (minDist * 2 - dist) / dist * 0.04;
        n1.vx -= dx * force;
        n1.vy -= dy * force;
        n2.vx += dx * force;
        n2.vy += dy * force;
      }
    }

    n1.x += n1.vx;
    n1.y += n1.vy;
    n1.vx *= 0.88;
    n1.vy *= 0.88;

    if (n1.pulseVal > 0) n1.pulseVal *= 0.93;
  }

  for (const link of links) {
    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const dist = Math.hypot(dx, dy) || 1;
    const targetDist = link.target.group === 'category' ? 120 : 80;
    const force = (dist - targetDist) * 0.01;
    if (link.source !== draggedNode) {
      link.source.vx += (dx / dist) * force;
      link.source.vy += (dy / dist) * force;
    }
    if (link.target !== draggedNode) {
      link.target.vx -= (dx / dist) * force;
      link.target.vy -= (dy / dist) * force;
    }
  }

  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.progress += p.speed;
    if (p.progress >= 1) {
      p.target.pulseVal = 1;
      pulses.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
  ctx.scale(scale, scale);
  ctx.translate(-width / 2, -height / 2);

  // Draw links
  for (const link of links) {
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
    ctx.lineWidth = 1.5 / scale;
    ctx.stroke();
  }

  // Draw traveling impulses
  if (!prefersReducedMotion) {
    for (const p of pulses) {
      const px = p.source.x + (p.target.x - p.source.x) * p.progress;
      const py = p.source.y + (p.target.y - p.source.y) * p.progress;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const isHovered = hoveredNode === node;
    const pulseR = node.radius + (node.pulseVal || 0) * 14;

    if (node.pulseVal > 0.05 && !prefersReducedMotion) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseR + 6, 0, Math.PI * 2);
      ctx.fillStyle = (node.color || '#38bdf8').replace('rgb', 'rgba').replace(')', ', 0.25)').replace('#', 'rgba(');
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, isHovered ? node.radius + 3 : node.radius, 0, Math.PI * 2);
    ctx.fillStyle = node.color || '#38bdf8';
    ctx.shadowColor = node.color || '#38bdf8';
    ctx.shadowBlur = isHovered || node.pulseVal > 0.1 ? 16 : 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Node text
    ctx.fillStyle = '#f8fafc';
    ctx.font = node.group === 'core' ? 'bold 12px sans-serif' : (node.group === 'category' ? '600 11px sans-serif' : '10px sans-serif');
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + node.radius + 14);
  }

  ctx.restore();
}

function animate() {
  stepPhysics();
  draw();
  requestAnimationFrame(animate);
}

export function fireImpulse(sourceId, targetId) {
  const s = nodes.find(n => n.id === sourceId);
  const t = nodes.find(n => n.id === targetId);
  if (s && t) {
    s.pulseVal = 0.8;
    pulses.push({ source: s, target: t, progress: 0, speed: prefersReducedMotion ? 0.2 : 0.035 + Math.random() * 0.02 });
  }
}

export function handleIncomingAccess(evt) {
  const core = 'node-root';
  const targetId = evt.nodeId || 'cat-tasks';
  fireImpulse(core, targetId);

  const targetNode = nodes.find(n => n.id === targetId);
  if (targetNode) {
    targetNode.pulseVal = 1;
    for (const l of links) {
      if (l.source === targetNode) fireImpulse(targetNode.id, l.target.id);
    }
  }

  if (evt.tokensSaved) {
    tokensSaved += evt.tokensSaved;
    const el = document.getElementById('tokensSavedVal');
    if (el) el.innerText = tokensSaved.toLocaleString();
  }

  addEventFeedItem(evt);
  showToast('Agent accessed ' + (evt.label || 'Knowledge Node'));
}

export function connectSSE() {
  const es = new EventSource('/api/stream');
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.event) handleIncomingAccess(data.event);
    } catch {}
  };
  es.onerror = () => setTimeout(connectSSE, 3000);
}

export function triggerSimulatedPulse() {
  const docNodes = nodes.filter(n => n.group === 'doc' || n.group === 'category');
  const target = docNodes[Math.floor(Math.random() * docNodes.length)];
  const saved = 800 + Math.floor(Math.random() * 900);

  fetch('/api/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodeId: target ? target.id : 'cat-tasks',
      label: target ? target.label : 'tasks/',
      agent: 'Pi / Claude / Cursor Agent',
      query: 'Read targeted structured memory',
      tokensSaved: saved
    })
  });
}

function addEventFeedItem(evt) {
  const feed = document.getElementById('eventFeed');
  if (!feed) return;
  const item = document.createElement('div');
  item.className = 'event-item';
  item.innerHTML = `<div class="event-header"><span>${evt.agent}</span><span>${evt.time}</span></div>` +
    `<div>${evt.query}</div>` +
    `<div class="event-token">⚡ +${(evt.tokensSaved || 750).toLocaleString()} tokens saved</div>`;
  feed.insertBefore(item, feed.firstChild);
  if (feed.children.length > 25) feed.removeChild(feed.lastChild);
}

export function clearEventFeed() {
  const feed = document.getElementById('eventFeed');
  if (feed) feed.innerHTML = '<div style="color:var(--muted); font-size:0.75rem; padding:0.5rem;">Feed cleared. Waiting for memory activity…</div>';
}

export function switchView(tab, btn) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
  const targetView = document.getElementById('view-' + tab);
  if (targetView) targetView.classList.add('active');
  if (tab === 'graph') resize();
}

export function renderDocs() {
  const renderEl = document.getElementById('markdown-render');
  const rawEl = document.getElementById('raw-text');
  const activeDocTitle = document.getElementById('activeDocTitle');
  const tokenEstimate = document.getElementById('docTokenEstimate');
  const breadcrumbsRoot = document.querySelector('.doc-breadcrumbs .crumb.root');

  if (activeDocTitle) {
    const parts = currentDocName.split(/[\/\\]/);
    activeDocTitle.innerText = parts[parts.length - 1];
    if (breadcrumbsRoot) {
      breadcrumbsRoot.innerText = parts.length > 1 ? parts.slice(0, -1).join('/') : '.agent-kb';
    }
  }

  // Token estimate (~4 characters per token)
  if (tokenEstimate) {
    const estimatedTokens = Math.round(currentMarkdown.length / 3.8);
    tokenEstimate.innerText = `⚡ ~${estimatedTokens.toLocaleString()} tokens`;
  }

  if (renderEl && window.marked) {
    renderEl.innerHTML = window.marked.parse(currentMarkdown);
    attachCodeCopyButtons();
    generateToc();
  }
  if (rawEl) {
    rawEl.value = currentMarkdown;
  }
}

function attachCodeCopyButtons() {
  const preElements = document.querySelectorAll('#markdown-render pre');
  preElements.forEach(pre => {
    if (pre.parentElement.classList.contains('code-block-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.type = 'button';
    btn.innerText = '📋 Copy';
    btn.onclick = () => {
      const code = pre.querySelector('code')?.innerText || pre.innerText;
      navigator.clipboard.writeText(code);
      btn.innerText = '✓ Copied';
      setTimeout(() => btn.innerText = '📋 Copy', 1800);
    };
    wrapper.appendChild(btn);
  });
}

function generateToc() {
  const tocContainer = document.getElementById('docToc');
  const tocPills = document.getElementById('tocPills');
  if (!tocContainer || !tocPills) return;

  const headings = document.querySelectorAll('#markdown-render h2, #markdown-render h3');
  if (headings.length < 2) {
    tocContainer.style.display = 'none';
    return;
  }

  tocPills.innerHTML = '';
  headings.forEach((h, idx) => {
    const id = 'heading-' + idx;
    h.id = id;
    const pill = document.createElement('a');
    pill.className = 'toc-pill';
    pill.href = '#' + id;
    pill.innerText = h.innerText.replace(/^#+\s*/, '');
    pill.onclick = (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth' });
    };
    tocPills.appendChild(pill);
  });
  tocContainer.style.display = 'flex';
}

export function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

export function copyMarkdown() {
  navigator.clipboard.writeText(currentMarkdown);
  showToast('Copied to clipboard!');
}

export function toggleSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    setTimeout(resize, 220);
  }
}

export function toggleHelpModal() {
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.toggle('show');
}

export async function regenerateKB() {
  const btn = document.getElementById('btn-regen');
  if (btn) {
    btn.innerHTML = '<span>⏳</span> Scanning…';
    btn.disabled = true;
  }
  try {
    const res = await fetch('/api/regenerate', { method: 'POST' });
    const data = await res.json();
    currentMarkdown = data.markdown;
    graphData = data.graph;
    structuredDocs = data.docs;
    initGraphData();
    renderKbTree();
    renderDocs();
    showToast('Knowledge network refreshed!');
    triggerSimulatedPulse();
  } catch {
    showToast('Failed to regenerate');
  } finally {
    if (btn) {
      btn.innerHTML = '<span>🔄</span> Re-scan';
      btn.disabled = false;
    }
  }
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  // Convert screen coordinates back into world coordinates taking offset & scale into account
  const worldX = (rawX - (width / 2 + offset.x)) / scale + width / 2;
  const worldY = (rawY - (height / 2 + offset.y)) / scale + height / 2;
  return { rawX, rawY, worldX, worldY };
}

// Canvas interactions
canvas.addEventListener('mousemove', e => {
  const { rawX, rawY, worldX, worldY } = getCanvasCoords(e);
  const tooltip = document.getElementById('nodeTooltip');

  if (draggedNode) {
    draggedNode.x = worldX;
    draggedNode.y = worldY;
    draggedNode.vx = 0;
    draggedNode.vy = 0;
    if (tooltip) tooltip.style.display = 'none';
    return;
  }

  if (isDraggingCanvas) {
    offset.x += e.clientX - dragStart.x;
    offset.y += e.clientY - dragStart.y;
    dragStart = { x: e.clientX, y: e.clientY };
    if (tooltip) tooltip.style.display = 'none';
    return;
  }

  hoveredNode = nodes.find(n => Math.hypot(n.x - worldX, n.y - worldY) < (n.radius + 6) / scale) || null;

  if (hoveredNode && tooltip) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${Math.min(rawX + 15, width - 250)}px`;
    tooltip.style.top = `${Math.min(rawY + 15, height - 120)}px`;
    document.getElementById('ttHeader').innerText = hoveredNode.label;
    document.getElementById('ttBody').innerText = hoveredNode.path ? `Path: ${hoveredNode.path}` : `Type: ${hoveredNode.group || 'Node'}`;
  } else if (tooltip) {
    tooltip.style.display = 'none';
  }
});

canvas.addEventListener('mousedown', e => {
  const { worldX, worldY } = getCanvasCoords(e);
  const hit = nodes.find(n => Math.hypot(n.x - worldX, n.y - worldY) < (n.radius + 6) / scale);

  if (hit) {
    draggedNode = hit;
    hit.pulseVal = 1;
    if (hit.path) {
      loadDoc(hit.path);
    }
    for (const l of links) {
      if (l.source === hit) fireImpulse(hit.id, l.target.id);
      if (l.target === hit) fireImpulse(hit.id, l.source.id);
    }
  } else {
    isDraggingCanvas = true;
    dragStart = { x: e.clientX, y: e.clientY };
  }
});

// Wheel zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
  scale = Math.min(Math.max(scale * zoomFactor, 0.4), 2.8);
}, { passive: false });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

  if (e.key === 'Escape') {
    const modal = document.getElementById('helpModal');
    if (modal?.classList.contains('show')) {
      toggleHelpModal();
      return;
    }
    const search = document.getElementById('kbSearchInput');
    if (search && isInput) {
      search.value = '';
      filterKbTree('');
      search.blur();
    }
  }

  if (isInput) return;

  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('kbSearchInput')?.focus();
  } else if (e.key === '1') {
    switchView('graph', document.getElementById('tab-btn-graph'));
  } else if (e.key === '2') {
    switchView('doc', document.getElementById('tab-btn-doc'));
  } else if (e.key === '3') {
    switchView('raw', document.getElementById('tab-btn-raw'));
  } else if (e.key === '+' || e.key === '=') {
    zoomIn();
  } else if (e.key === '-' || e.key === '_') {
    zoomOut();
  } else if (e.key === '0') {
    resetGraph();
  } else if (e.key === 's' || e.key === 'S') {
    triggerSimulatedPulse();
  } else if (e.key === 'r' || e.key === 'R') {
    regenerateKB();
  } else if (e.key === 'c' || e.key === 'C') {
    copyMarkdown();
  } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    toggleHelpModal();
  } else if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault();
    toggleSidebar();
  }
});

window.addEventListener('mouseup', () => {
  draggedNode = null;
  isDraggingCanvas = false;
});

window.addEventListener('resize', resize);

// Global bindings for inline onclicks
window.switchView = switchView;
window.resetGraph = resetGraph;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.triggerSimulatedPulse = triggerSimulatedPulse;
window.copyMarkdown = copyMarkdown;
window.regenerateKB = regenerateKB;
window.filterKbTree = filterKbTree;
window.clearEventFeed = clearEventFeed;
window.toggleSidebar = toggleSidebar;
window.toggleHelpModal = toggleHelpModal;

// Initialization
setTimeout(() => {
  resize();
  renderKbTree();
  renderDocs();
  connectSSE();
  animate();
}, 40);
