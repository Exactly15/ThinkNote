/* layout.js */
(function(){
  'use strict';
  const TN=window.TN=window.TN||{};
  const NW=220, NH=90, PX=28, PY=100;

  function buildTree(nodes){
    const byId={}, children={}, roots=[];
    nodes.forEach(n=>{byId[n.id]=n; children[n.id]=[];});
    nodes.forEach(n=>{
      if(n.parentId&&byId[n.parentId]) children[n.parentId].push(n.id);
      else roots.push(n.id);
    });
    return{byId,children,roots};
  }

  function sw(id,ch){ const k=ch[id]||[]; if(!k.length)return NW; return Math.max(NW,k.reduce((s,c)=>s+sw(c,ch)+PX,-PX)); }

  function assign(id,cx,y,ch,pos){
    pos[id]={x:cx-NW/2,y};
    const k=ch[id]||[]; if(!k.length)return;
    const tw=k.reduce((s,c)=>s+sw(c,ch)+PX,-PX);
    let rx=cx-tw/2;
    k.forEach(c=>{const w=sw(c,ch); assign(c,rx+w/2,y+NH+PY,ch,pos); rx+=w+PX;});
  }

  function layoutTree(nodes){
    if(!nodes.length)return{};
    const{children,roots}=buildTree(nodes);
    const pos={};
    let rx=0;
    roots.forEach(r=>{const w=sw(r,children); assign(r,rx+w/2,0,children,pos); rx+=w+PX;});
    return pos;
  }

  function getBounds(pos){
    const xs=Object.values(pos).map(p=>p.x), ys=Object.values(pos).map(p=>p.y);
    return{minX:Math.min(...xs),maxX:Math.max(...xs)+NW,minY:Math.min(...ys),maxY:Math.max(...ys)+NH};
  }

  Object.assign(TN,{layoutTree,getBounds,NW,NH});
})();
