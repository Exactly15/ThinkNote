/* render.js — document-flow tree */
(function(){
  'use strict';
  const TN = window.TN = window.TN || {};

  const docView = document.getElementById('doc-view');
  const empty   = document.getElementById('tree-empty');

  /* ── time helper ── */
  function fmtT(iso){ return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
  function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── build adjacency ── */
  function buildAdj(nodes){
    const byId={}, ch={}, roots=[];
    nodes.forEach(n=>{ byId[n.id]=n; ch[n.id]=[]; });
    nodes.forEach(n=>{ if(n.parentId&&byId[n.parentId]) ch[n.parentId].push(n.id); else roots.push(n.id); });
    return{byId,ch,roots};
  }

  /*
   * Walk depth-first and collect rows with guide metadata.
   * guides[k] = 'pass' | 'empty' | 'tee' | 'end'
   *   pass  → vertical line continues (ancestor has more siblings below)
   *   empty → no line (ancestor was the last child)
   *   tee   → ├─  (this node is NOT the last child of its parent)
   *   end   → └─  (this node IS the last child of its parent)
   */
  function walkTree(nodes){
    const{byId,ch,roots}=buildAdj(nodes);
    const rows=[];

    function dfs(id, depth, guides){
      const kids=ch[id]||[];
      rows.push({node:byId[id], depth, guides:[...guides], hasChildren: kids.length>0});
      kids.forEach((kid,i)=>{
        const isLast = i===kids.length-1;
        // Transform parent guides: tee→pass, end→empty, pass/empty unchanged
        const next = guides.map(g=> g==='tee'?'pass': g==='end'?'empty': g);
        next.push(isLast?'end':'tee');
        dfs(kid, depth+1, next);
      });
    }

    roots.forEach(rid=>dfs(rid, 0, []));
    return rows;
  }

  /* ── render one row ── */
  function rowHtml(row){
    const{node,depth,guides,hasChildren}=row;
    const guidesHtml = guides.map(g=>`<span class="g g-${g}"></span>`).join('');
    const conflictBadge = node.conflictNote
      ? `<div class="dr-conflict"><i data-feather="alert-triangle"></i>${escH(node.conflictNote)}</div>`
      : '';
    const stemLeft = depth * 24 + 11;
    const stemHtml = hasChildren ? `<div class="dr-stem" style="left: ${stemLeft}px;"></div>` : '';
    return `
      <div class="dr" id="dr-${node.id}" data-depth="${depth}">
        ${stemHtml}
        <div class="dr-guides">${guidesHtml}</div>
        <div class="dr-dot d${Math.min(depth,4)}"></div>
        <div class="dr-body">
          <div class="dr-meta"><span class="dr-time">${fmtT(node.timestamp)}</span></div>
          <div class="dr-text">${escH(node.correctedText||node.text)}</div>
          ${conflictBadge}
        </div>
      </div>`;
  }

  /* ── main render ── */
  function renderTree(nodes){
    empty.classList.toggle('hidden', nodes.length>0);
    if(!nodes.length){ docView.innerHTML=''; return; }
    const rows = walkTree(nodes);
    docView.innerHTML = rows.map(rowHtml).join('');
    // Scroll to bottom so newest thought is visible
    docView.scrollTop = docView.scrollHeight;
  }

  TN.renderTree = renderTree;
  // No-op stubs for removed features
  TN.treeCenter  = ()=>({x:0,y:0});
  // Re-run feather.replace after each render so badges get icons
  const _origRender = renderTree;
  TN.renderTree = function(nodes){ _origRender(nodes); if(window.feather) feather.replace(); };
})();
