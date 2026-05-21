/* export.js */
(function(){
  'use strict';
  const TN=window.TN=window.TN||{};

  function ordered(nodes){
    const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
    const ch=Object.fromEntries(nodes.map(n=>[n.id,[]]));
    const roots=[];
    nodes.forEach(n=>{ if(n.parentId&&byId[n.parentId])ch[n.parentId].push(n.id); else roots.push(n.id); });
    const out=[];
    function walk(id,d){ out.push({node:byId[id],depth:d}); ch[id].forEach(c=>walk(c,d+1)); }
    roots.forEach(r=>walk(r,0));
    return out;
  }

  function dl(blob,name){
    const u=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=u; a.download=name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(u),5000);
  }

  function safe(s){ return s.replace(/[^a-z0-9\-_\s]/gi,'').trim().replace(/\s+/g,'_')||'thinknote'; }

  function exportTxt(session){
    const o=ordered(session.nodes);
    const lines=[`ThinkNote: ${session.name}`,`Exported: ${new Date().toLocaleString()}`,'─'.repeat(40),''];
    o.forEach(({node,depth},i)=>{
      const ind='    '.repeat(depth);
      const pre=depth===0?'◉ ':((!o[i+1]||o[i+1].depth<=depth)?'└── ':'├── ');
      lines.push(ind+pre+(node.correctedText||node.text));
    });
    dl(new Blob([lines.join('\n')],{type:'text/plain'}),safe(session.name)+'.txt');
  }

  async function exportDocx(session){
    if(typeof docx==='undefined'){ alert('DOCX library not loaded. Check internet connection.'); return; }
    const{Document,Packer,Paragraph,TextRun,HeadingLevel}=docx;
    const o=ordered(session.nodes);
    const HL=[HeadingLevel.HEADING_1,HeadingLevel.HEADING_2,HeadingLevel.HEADING_3,HeadingLevel.HEADING_4,HeadingLevel.HEADING_5];
    const children=[
      new Paragraph({text:session.name,heading:HeadingLevel.TITLE}),
      new Paragraph({children:[new TextRun({text:`Exported: ${new Date().toLocaleString()}`,color:'888888',size:20})],spacing:{after:240}}),
    ];
    o.forEach(({node,depth})=>{
      const lv=Math.min(depth,HL.length-1);
      const text=node.correctedText||node.text;
      children.push(new Paragraph({heading:HL[lv],children:[new TextRun({text:'  '.repeat(Math.max(0,depth-1))+(depth>0?'› ':'')+text})],spacing:{before:depth===0?200:60}}));
    });
    const blob=await Packer.toBlob(new Document({sections:[{children}]}));
    dl(blob,safe(session.name)+'.docx');
  }

  Object.assign(TN,{exportTxt,exportDocx});
})();
