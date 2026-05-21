/* ai.js */
(function(){
  'use strict';
  const TN=window.TN=window.TN||{};

  const URLS={
    openrouter:'https://openrouter.ai/api/v1',
    openai:'https://api.openai.com/v1',
    ollama:'http://localhost:11434/v1',
    lmstudio:'http://localhost:1234/v1',
  };
  const DEF_MODELS={
    openrouter:'openai/gpt-4o-mini',openai:'gpt-4o-mini',
    anthropic:'claude-3-haiku-20240307',ollama:'llama3',
    lmstudio:'local-model',custom:'gpt-4o-mini',
  };

  function baseUrl(s){ return(s.baseUrl||URLS[s.provider]||'').replace(/\/$/,''); }
  function headers(s){
    const h={'Content-Type':'application/json'};
    if(s.apiKey) h['Authorization']='Bearer '+s.apiKey;
    if(s.provider==='openrouter'){h['HTTP-Referer']='https://thinknote.app';h['X-Title']='ThinkNote';}
    return h;
  }
  function model(s){ return s.model||DEF_MODELS[s.provider]||'gpt-4o-mini'; }

  function prompt(nodes){
    const list=nodes.map(n=>`  {"id":"${n.id}","text":${JSON.stringify(n.correctedText||n.text)}}`).join(',\n');
    return `You are a thought-organization AI. Given these thoughts, do the following:\n1. Reorganize them into a tree: abstract/general thoughts → root (parentId: null), specific thoughts → children of most relevant parent.\n2. Correct grammar and spelling but preserve meaning.\n3. Detect CONFLICTS: if two thoughts directly contradict each other (e.g. "I want X" vs "I don't want X"), mark the NEWER thought (higher index) with overridesId set to the older thought's id, and a short conflictNote (max 8 words).\n4. Detect DUPLICATES: if two thoughts express the same idea (even with different wording), mark the NEWER one with overridesId set to the older one's id, and conflictNote: "Duplicate removed".\n\nInput:\n[\n${list}\n]\n\nRespond ONLY with a raw JSON array. Each item: {id, correctedText, parentId, overridesId?, conflictNote?}. No markdown, no explanation.`;
  }

  async function callOpenAI(s,nodes){
    const url=baseUrl(s)+'/chat/completions';
    const res=await fetch(url,{method:'POST',headers:headers(s),body:JSON.stringify({
      model:model(s),temperature:0.2,max_tokens:2048,
      messages:[{role:'system',content:'You are a precise JSON-only AI.'},{role:'user',content:prompt(nodes)}]
    })});
    if(!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return(await res.json()).choices?.[0]?.message?.content||'';
  }

  async function callAnthropic(s,nodes){
    const url=(s.baseUrl||'https://api.anthropic.com').replace(/\/$/,'')+'/v1/messages';
    const res=await fetch(url,{method:'POST',headers:{
      'Content-Type':'application/json','x-api-key':s.apiKey,'anthropic-version':'2023-06-01'
    },body:JSON.stringify({model:model(s),max_tokens:2048,messages:[{role:'user',content:prompt(nodes)}]})});
    if(!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    return(await res.json()).content?.[0]?.text||'';
  }

  function parse(raw,origNodes){
    const clean=raw.trim().replace(/^```json?\n?/,'').replace(/```$/,'').trim();
    let parsed; try{parsed=JSON.parse(clean);}catch{throw new Error('AI returned invalid JSON.');}
    if(!Array.isArray(parsed)) throw new Error('Unexpected AI response format.');
    const om=Object.fromEntries(origNodes.map(n=>[n.id,n]));

    // Build a set of node IDs that have been overridden (to remove them)
    const overridden=new Set();
    parsed.forEach(x=>{ if(x.overridesId) overridden.add(x.overridesId); });

    return parsed
      .filter(x=>x.id && om[x.id] && !overridden.has(x.id)) // drop old contradicted nodes
      .map(x=>{
        // If this node overrides an old one, inherit that old node's parentId
        // so it fills the same slot in the tree
        const inheritedParent = x.overridesId && om[x.overridesId]
          ? om[x.overridesId].parentId
          : null;
        return {
          ...(om[x.id]||{}),
          id: x.id,
          correctedText: x.correctedText||x.text||'',
          parentId: x.overridesId ? inheritedParent : (x.parentId||null),
          conflictNote: x.conflictNote||null,
          overridesId: x.overridesId||null,
        };
      });
  }

  async function processThoughts(s,nodes){
    if(!nodes.length||s.provider==='none') return nodes;
    const raw=s.provider==='anthropic'?await callAnthropic(s,nodes):await callOpenAI(s,nodes);
    return parse(raw,nodes);
  }

  async function testConnection(s){
    const test=[{id:'t1',text:'Hello world',correctedText:'Hello world'},{id:'t2',text:'A detail',correctedText:'A detail'}];
    await processThoughts(s,test); return true;
  }

  async function askQuestion(s, question, nodes) {
    if (s.provider === 'none') return "AI provider not configured.";
    const list = nodes.map(n => `- ${n.correctedText || n.text}`).join('\n');
    const systemPrompt = `You are an AI assistant. Answer the user's question based on their thoughts below if it concerns them. Otherwise, answer using your general knowledge.\nThoughts:\n${list}`;
    
    if (s.provider === 'anthropic') {
      const url = (s.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': s.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model(s),
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
      return (await res.json()).content?.[0]?.text || '';
    } else {
      const url = baseUrl(s) + '/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: headers(s),
        body: JSON.stringify({
          model: model(s),
          temperature: 0.7,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ]
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
      return (await res.json()).choices?.[0]?.message?.content || '';
    }
  }

  Object.assign(TN,{processThoughts,testConnection,askQuestion});
})();
