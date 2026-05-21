/* app.js — main orchestrator */
(function(){
  'use strict';
  const TN=window.TN;
  const $=id=>document.getElementById(id);

  // Elements
  const recentPanel  =$('recent-panel');
  const collapseBtn  =$('collapse-btn');
  const expandBtn    =$('expand-btn');
  const newNoteBtn   =$('new-note-btn');
  const sessionsList =$('sessions-list');
  const sessionTitle =$('session-title');
  const themeBtn     =$('theme-btn');
  const iconMoon     =$('icon-moon');
  const iconSun      =$('icon-sun');
  const exportBtn    =$('export-btn');
  const exportMenu   =$('export-menu');
  const settingsBtn  =$('settings-btn');
  const drawer       =$('settings-drawer');
  const ovl          =$('ovl');
  const closeSet     =$('close-settings');
  const provSel      =$('provider-sel');
  const apiKey       =$('api-key');
  const baseUrl      =$('base-url');
  const modelName    =$('model-name');
  const secKey       =$('sec-key');
  const secUrl       =$('sec-url');
  const testBtn      =$('test-btn');
  const saveBtn      =$('save-btn');
  const connMsg      =$('conn-msg');
  const noteFontSel  =$('note-font-sel');
  const inputEl      =$('thought-input');
  const sendBtn      =$('send-btn');
  const aiPip        =$('ai-pip');
  const toasts       =$('toasts');
  const askToggle    =$('ask-toggle-chk');
  const askPanel     =$('ask-panel');
  const closeAskPanel=$('close-ask-panel');
  const askBody      =$('ask-body');

  let sid=null, settings=TN.loadSettings();

  // ── Toast ──
  function toast(msg,type='info',dur=3200){
    const el=document.createElement('div');
    el.className=`toast ${type}`; el.textContent=msg;
    toasts.appendChild(el);
    setTimeout(()=>{ el.style.animation='tOut .2s ease forwards'; setTimeout(()=>el.remove(),220); },dur);
  }

  // ── Theme ──
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    iconMoon.classList.toggle('hidden', t==='light');
    iconSun.classList.toggle('hidden',  t==='dark');
    localStorage.setItem('tn_theme',t);
  }
  themeBtn.addEventListener('click',()=>{
    applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
  });

  // ── Panel ──
  collapseBtn.addEventListener('click',()=>{ recentPanel.classList.add('collapsed'); expandBtn.classList.remove('hidden'); });
  expandBtn.addEventListener('click',()=>{ recentPanel.classList.remove('collapsed'); expandBtn.classList.add('hidden'); });
  if(closeAskPanel) closeAskPanel.addEventListener('click',()=>{ askPanel.classList.add('collapsed'); });

  // ── Sessions list ──
  function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderSessions(){
    const all=TN.getSorted();
    sessionsList.innerHTML='';
    all.forEach(s=>{
      const div=document.createElement('div');
      div.className='s-item'+(s.id===sid?' active':'');
      div.innerHTML=`
        <div class="s-icon"><i data-lucide="file-text"></i></div>
        <div class="s-info">
          <div class="s-name">${escH(s.name)}</div>
          <div class="s-date">${TN.fmtDate(s.updatedAt)}</div>
        </div>
        <button class="s-del" title="Delete note"><i data-lucide="trash-2"></i></button>`;
      div.addEventListener('click',e=>{ if(e.target.closest('.s-del'))return; loadSession(s.id); });
      div.querySelector('.s-del').addEventListener('click',e=>{ e.stopPropagation(); if(confirm(`Delete "${s.name}"?`)){ TN.deleteSession(s.id); if(sid===s.id)newSession(); else renderSessions(); } });
      sessionsList.appendChild(div);
    });
    lucide.createIcons({ nodes: [sessionsList] });
  }

  function loadSession(id){
    const s=TN.getSession(id); if(!s)return;
    sid=id; sessionTitle.textContent=s.name;
    renderSessions(); renderCurrent(); renderQuestions();
  }

  function newSession(){ const s=TN.createSession(); loadSession(s.id); }
  newNoteBtn.addEventListener('click',newSession);

  // ── Title rename ──
  sessionTitle.addEventListener('blur',()=>{
    const name=sessionTitle.textContent.trim()||'Untitled Note';
    sessionTitle.textContent=name;
    if(sid){ TN.updateSessionName(sid,name); renderSessions(); }
  });
  sessionTitle.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();sessionTitle.blur();} });

  // ── Render tree ──
  function renderCurrent(){
    const s=TN.getSession(sid); if(!s)return;
    TN.renderTree(s.nodes);
  }

  function renderQuestions(){
    if(!askBody) return;
    askBody.innerHTML = '';
    const s=TN.getSession(sid); if(!s || !s.questions) return;
    // Render newest first
    [...s.questions].reverse().forEach(q => {
      const div = document.createElement('div');
      div.className = 'ask-item';
      div.innerHTML = `<div class="ask-q">${escH(q.text)}</div><div class="ask-a">${marked.parse(q.answer)}</div>`;
      askBody.appendChild(div);
    });
  }

  // ── AI dot ──
  function pipStatus(st){ aiPip.className='ai-pip '+(st||''); aiPip.title={ready:'AI ready',working:'AI processing…',err:'AI error'}[st]||'AI not configured'; }
  function refreshPip(){ pipStatus(settings.provider!=='none'?'ready':''); }

  // ── Send thought ──
  async function send(){
    const text=inputEl.value.trim(); if(!text)return;
    inputEl.value=''; inputEl.style.height='auto';
    sendBtn.disabled=true;
    
    const isQuestion = askToggle && askToggle.checked && (
      text.endsWith('?') || 
      /^(what|how|why|who|when|where|is|are|can|do|does|will)\b/i.test(text) ||
      /^(write|summarize|create|make|generate|explain|tell|list|draft|rewrite|translate|help|solve|calculate|compare|describe|analyze|give|show|evaluate|review)\b/i.test(text)
    );
    const s=TN.getSession(sid);
    if(!s){ toast('No active note.','err'); sendBtn.disabled=false; return; }

    if(isQuestion) {
      if (askPanel) askPanel.classList.remove('collapsed');
      const ansEl = document.createElement('div');
      ansEl.className = 'ask-item';
      ansEl.innerHTML = `<div class="ask-q">${escH(text)}</div><div class="ask-a" style="opacity:0.6">Thinking…</div>`;
      if (askBody) askBody.prepend(ansEl);
      
      if(settings.provider!=='none'){
        pipStatus('working');
        TN.askQuestion(settings, text, s.nodes).then(answer => {
          if (TN.addQuestion) TN.addQuestion(sid, text, answer);
          renderQuestions();
          pipStatus('ready');
        }).catch(e => {
          ansEl.querySelector('.ask-a').style.opacity = '1';
          ansEl.querySelector('.ask-a').textContent = 'Error: ' + e.message;
          pipStatus('err');
        });
      } else {
        ansEl.querySelector('.ask-a').style.opacity = '1';
        ansEl.querySelector('.ask-a').textContent = 'Error: AI not configured';
      }
      sendBtn.disabled=false; inputEl.focus();
      return;
    }
    
    const node=TN.addNode(sid,text);
    if(!node){ toast('No active note.','err'); sendBtn.disabled=false; return; }
    renderCurrent();

    if(settings.provider!=='none'){
      pipStatus('working');
      try{
        const latestS = TN.getSession(sid);
        const updated=await TN.processThoughts(settings,latestS.nodes);
        TN.setNodes(sid,updated);
        renderCurrent();
        pipStatus('ready');
      }catch(e){ toast('AI: '+e.message,'err'); pipStatus('err'); }
    }
    sendBtn.disabled=false; inputEl.focus();
  }

  sendBtn.addEventListener('click',send);
  inputEl.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} });
  inputEl.addEventListener('input',()=>{ inputEl.style.height='auto'; inputEl.style.height=Math.min(inputEl.scrollHeight,100)+'px'; });

  // ── Settings ──
  function openSettings(){ fillSettings(); drawer.classList.add('open'); ovl.classList.remove('hidden'); }
  function closeSettings(){ drawer.classList.remove('open'); ovl.classList.add('hidden'); connMsg.textContent=''; connMsg.className='conn-msg'; }
  settingsBtn.addEventListener('click',openSettings);
  closeSet.addEventListener('click',closeSettings);
  ovl.addEventListener('click',closeSettings);

  function fillSettings(){
    provSel.value=settings.provider; apiKey.value=settings.apiKey;
    baseUrl.value=settings.baseUrl; modelName.value=settings.model;
    if(noteFontSel) noteFontSel.value=localStorage.getItem('tn_note_font')||'source-serif';
    toggleFields();
  }
  function toggleFields(){
    const p=provSel.value;
    secKey.style.display=['openrouter','openai','anthropic','custom'].includes(p)?'':'none';
    secUrl.style.display=['ollama','lmstudio','custom','anthropic'].includes(p)?'':'none';
  }
  provSel.addEventListener('change',toggleFields);

  saveBtn.addEventListener('click',()=>{
    settings={provider:provSel.value,apiKey:apiKey.value.trim(),baseUrl:baseUrl.value.trim(),model:modelName.value.trim()};
    TN.saveSettings(settings); refreshPip(); toast('Settings saved','ok');
    // Apply font
    if(noteFontSel){ const f=noteFontSel.value; localStorage.setItem('tn_note_font',f); applyNoteFont(f); }
    closeSettings();
  });

  testBtn.addEventListener('click',async()=>{
    connMsg.textContent='Testing…'; connMsg.className='conn-msg wait';
    const cand={provider:provSel.value,apiKey:apiKey.value.trim(),baseUrl:baseUrl.value.trim(),model:modelName.value.trim()};
    try{ await TN.testConnection(cand); connMsg.textContent='✓ Connected'; connMsg.className='conn-msg ok'; }
    catch(e){ connMsg.textContent='✗ '+e.message; connMsg.className='conn-msg fail'; }
  });

  // ── Export ──
  exportBtn.addEventListener('click',e=>{ e.stopPropagation(); exportMenu.classList.toggle('hidden'); });
  document.addEventListener('click',()=>exportMenu.classList.add('hidden'));

  $('export-txt').addEventListener('click',()=>{
    const s=TN.getSession(sid); if(!s||!s.nodes.length){toast('Nothing to export','err');return;}
    TN.exportTxt(s); toast('Exported as TXT','ok');
  });
  $('export-docx').addEventListener('click',async()=>{
    const s=TN.getSession(sid); if(!s||!s.nodes.length){toast('Nothing to export','err');return;}
    await TN.exportDocx(s); toast('Exported as DOCX','ok');
  });

  // ── Note font ──
  const FONTS={
    'source-serif': "'Source Serif 4', Georgia, serif",
    'dm-sans':      "'DM Sans', system-ui, sans-serif",
    'georgia':      "Georgia, 'Times New Roman', serif",
    'mono':         "'Courier New', Courier, monospace",
  };
  function applyNoteFont(key){
    const fam=FONTS[key]||FONTS['source-serif'];
    document.documentElement.style.setProperty('--note-font', fam);
  }

  // ── Init ──
  function init(){
    applyTheme(localStorage.getItem('tn_theme')||'dark');
    applyNoteFont(localStorage.getItem('tn_note_font')||'source-serif');
    if(noteFontSel) noteFontSel.value=localStorage.getItem('tn_note_font')||'source-serif';
    const all=TN.getSorted();
    if(all.length) loadSession(all[0].id); else newSession();
    refreshPip();
    lucide.createIcons();
    
    // Hide loader
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hidden');
    }, 2000); // 2000ms delay to display animation
  }
  init();
})();
