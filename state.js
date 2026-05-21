/* state.js */
(function(){
  'use strict';
  const TN = window.TN = window.TN || {};
  const SK = 'tn_sessions', SET = 'tn_settings';
  const uid = () => Math.random().toString(36).slice(2,10);
  const now = () => new Date().toISOString();
  const EMOJIS = ['💡','🌱','🔮','🧠','⚡','🎯','🔑','🌊','🔥','✨','📌','🗺️'];
  const rEmoji = () => EMOJIS[Math.floor(Math.random()*EMOJIS.length)];

  function fmtDate(iso){
    const d=new Date(iso), t=new Date();
    if(d.toDateString()===t.toDateString()) return 'Today '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    return d.toLocaleDateString([],{month:'short',day:'numeric'});
  }

  const DEF_SET = {provider:'none',apiKey:'',baseUrl:'',model:''};
  function loadSettings(){ try{return{...DEF_SET,...JSON.parse(localStorage.getItem(SET)||'{}')};}catch{return{...DEF_SET};} }
  function saveSettings(s){ localStorage.setItem(SET,JSON.stringify(s)); }

  function loadSessions(){ try{return JSON.parse(localStorage.getItem(SK)||'{}');}catch{return{};} }
  function saveSessions(s){ localStorage.setItem(SK,JSON.stringify(s)); }

  function createSession(name='Untitled Note'){
    const sessions=loadSessions(), id=uid();
    sessions[id]={id,name,emoji:rEmoji(),createdAt:now(),updatedAt:now(),nodes:[],questions:[]};
    saveSessions(sessions); return sessions[id];
  }
  function getSession(id){ 
    const s=loadSessions()[id]; 
    if(s && !s.questions) s.questions = [];
    return s||null; 
  }
  function updateSessionName(id,name){
    const s=loadSessions(); if(s[id]){s[id].name=name;s[id].updatedAt=now();} saveSessions(s);
  }
  function deleteSession(id){ const s=loadSessions(); delete s[id]; saveSessions(s); }
  function setNodes(sid,nodes){
    const s=loadSessions(); if(!s[sid])return; s[sid].nodes=nodes; s[sid].updatedAt=now(); saveSessions(s);
  }
  function addNode(sid,text){
    const s=loadSessions(); if(!s[sid])return null;
    const node={id:uid(),text,correctedText:text,parentId:null,timestamp:now()};
    s[sid].nodes.push(node); s[sid].updatedAt=now(); saveSessions(s); return node;
  }
  function getSorted(){
    return Object.values(loadSessions()).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  }
  function addQuestion(sid, text, answer) {
    const s = loadSessions();
    if (!s[sid]) return null;
    if (!s[sid].questions) s[sid].questions = [];
    s[sid].questions.push({ id: uid(), text, answer, timestamp: now() });
    s[sid].updatedAt = now();
    saveSessions(s);
  }

  Object.assign(TN,{uid,now,fmtDate,rEmoji,loadSettings,saveSettings,
    loadSessions,saveSessions,getSorted,createSession,getSession,
    updateSessionName,deleteSession,setNodes,addNode,addQuestion});
})();
