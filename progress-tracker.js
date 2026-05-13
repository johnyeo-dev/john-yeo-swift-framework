// ── PAC SWIFT PROGRESS TRACKER ──────────────────────────────────────────────
(function() {
  'use strict';

  // ── FIREBASE CONFIG ───────────────────────────────────────────────────────
  var FB_DB_URL = 'https://pac-swift-default-rtdb.asia-southeast1.firebasedatabase.app';
  var FB_SECRET = 'pNYSribFCUSYRLRdJHOPsyOU5DdEVamtyzDEThc9';

  function tasksToObj(tasks) {
    var obj = {};
    if (!Array.isArray(tasks)) return obj;
    tasks.forEach(function(t) { if (t && t.id) obj[t.id] = t; });
    return obj;
  }
  function tasksFromObj(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return Object.keys(obj).map(function(k) { return obj[k]; }).filter(Boolean);
  }

  function syncUserToFirebase(u) {
    if (!u) return;
    var data = {
      progress:  getProgress(u),
      actions:   getActions(u),
      results:   getResults(u),
      tasks:     tasksToObj(getTasks(u)),
      lastUpdated: Date.now()
    };
    fetch(FB_DB_URL + '/users/' + u + '.json?auth=' + FB_SECRET, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function() { /* silent fail — localStorage still has the data */ });
  }

  function syncAnalyticsToFirebase(u) {
    if (!u) return;
    try {
      var a = JSON.parse(localStorage.getItem('pac-swift-analytics-' + u) || '{}');
      if (!Object.keys(a).length) return;
      fetch(FB_DB_URL + '/analytics/' + u + '.json?auth=' + FB_SECRET, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a)
      }).catch(function() {});
    } catch(e) {}
  }

  function loadUserFromFirebase(u, callback) {
    if (!u) { if (callback) callback(); return; }
    fetch(FB_DB_URL + '/users/' + u + '.json?auth=' + FB_SECRET)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data) {
          if (data.progress) localStorage.setItem('pac-swift-progress-' + u, JSON.stringify(data.progress));
          if (data.actions)  localStorage.setItem('pac-swift-actions-'  + u, JSON.stringify(data.actions));
          if (data.results)  localStorage.setItem('pac-swift-results-'  + u, JSON.stringify(data.results));
          if (data.tasks)    localStorage.setItem('pac-swift-tasks-'    + u, JSON.stringify(tasksFromObj(data.tasks)));
        }
        if (callback) callback();
      })
      .catch(function() { if (callback) callback(); });
  }

  // ── STEPS ────────────────────────────────────────────────────────────────
  var STEPS = [
    { id:'sig',   label:'Signature',    short:'S',   color:'#0ABFBC', cat:'SWIFT', page:'signature-programme.html',    desc:'Created your Signature Programme',        pts:{action:25,done:75,result:150} },
    { id:'web',   label:'Webinar',      short:'W',   color:'#4A8FE7', cat:'SWIFT', page:'webinar-programme.html',       desc:'Run your first Webinar',                  pts:{action:25,done:75,result:150} },
    { id:'inv',   label:'Invite',       short:'I',   color:'#8B5CF6', cat:'SWIFT', page:'invite-programme.html',        desc:'Set up your Invite / Referral system',    pts:{action:25,done:75,result:150} },
    { id:'fill',  label:'Fill Class',   short:'F',   color:'#F59E0B', cat:'SWIFT', page:'fill-programme.html',          desc:'Used the Revenue Calculator',             pts:{action:25,done:75,result:150} },
    { id:'track', label:'Track',        short:'T',   color:'#10B981', cat:'SWIFT', page:'track-programme.html',         desc:'Set up your tracking system',             pts:{action:25,done:75,result:150} },
    { id:'p1',    label:'Prompt 1',     short:'✦1',  color:'#0ABFBC', cat:'AI',    page:'prompt-1-signature.html',      desc:'Run Prompt 1 · Signature',                pts:{action:10,done:40,result:75} },
    { id:'p2',    label:'Prompt 2',     short:'✦2',  color:'#4A8FE7', cat:'AI',    page:'prompt-2-lead-magnet.html',    desc:'Run Prompt 2 · Lead Magnet',              pts:{action:10,done:40,result:75} },
    { id:'p3',    label:'Prompt 3',     short:'✦3',  color:'#8B5CF6', cat:'AI',    page:'prompt-3-teach-to-pitch.html', desc:'Run Prompt 3 · Teach to Pitch',           pts:{action:10,done:40,result:75} },
    { id:'p4',    label:'Prompt 4',     short:'✦4',  color:'#F59E0B', cat:'AI',    page:'prompt-3-content.html',        desc:'Run Prompt 4 · Content Style',            pts:{action:10,done:40,result:75} },
    { id:'p5',    label:'Prompt 5',     short:'✦5',  color:'#10B981', cat:'AI',    page:'prompt-4-5-forms.html',        desc:'Run Prompt 5 · Lead Collection Form',     pts:{action:10,done:40,result:75} },
    { id:'p6',    label:'Prompt 6',     short:'✦6',  color:'#EC4899', cat:'AI',    page:'prompt-6-feedback.html',       desc:'Run Prompt 6 · Feedback Form',            pts:{action:10,done:40,result:75} },
  ];

  var TASK_PTS_ADD  = 5;   // points for adding a task
  var TASK_PTS_DONE = 20;  // bonus points for completing a task

  // ── RANKS ─────────────────────────────────────────────────────────────────
  var RANKS = [
    { min:    0, name:'Starter',      emoji:'🌱', color:'#9CA3AF', desc:'You\'ve just begun!' },
    { min:   25, name:'Planner',      emoji:'📋', color:'#10B981', desc:'You\'re setting intentions' },
    { min:   80, name:'Action Taker', emoji:'⚡', color:'#0ABFBC', desc:'You\'re making moves' },
    { min:  200, name:'Go-Getter',    emoji:'🎯', color:'#4A8FE7', desc:'Consistent daily action' },
    { min:  500, name:'Builder',      emoji:'🔨', color:'#8B5CF6', desc:'You\'re building real momentum' },
    { min: 1000, name:'Momentum',     emoji:'🚀', color:'#F59E0B', desc:'Unstoppable energy' },
    { min: 2000, name:'Closer',       emoji:'💎', color:'#EC4899', desc:'You close what you start' },
    { min: 4000, name:'PAC Champion', emoji:'🏆', color:'#F59E0B', desc:'Top tier performer' },
    { min: 8000, name:'SWIFT Master', emoji:'👑', color:'#0ABFBC', desc:'Elite — the best of the best' },
  ];

  function getRank(pts) {
    var rank = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) { if (pts >= RANKS[i].min) rank = RANKS[i]; else break; }
    return rank;
  }
  function getNextRank(pts) {
    for (var i = 0; i < RANKS.length; i++) { if (pts < RANKS[i].min) return RANKS[i]; }
    return null;
  }

  // ── PAGE SUGGESTIONS ─────────────────────────────────────────────────────
  var SUGGESTIONS = {
    'signature-programme.html':    { stepId:'sig',   text:'Have you built your Signature Programme yet?' },
    'webinar-programme.html':      { stepId:'web',   text:'Have you run your first webinar?' },
    'invite-programme.html':       { stepId:'inv',   text:'Have you set up your referral system?' },
    'fill-programme.html':         { stepId:'fill',  text:'Have you used the Revenue Calculator to plan your classes?' },
    'track-programme.html':        { stepId:'track', text:'Have you started tracking your results?' },
    'prompt-1-signature.html':     { stepId:'p1',    text:'Have you run Prompt 1 with Claude yet?' },
    'prompt-2-lead-magnet.html':   { stepId:'p2',    text:'Have you created your Lead Magnet with Prompt 2?' },
    'prompt-3-teach-to-pitch.html':{ stepId:'p3',    text:'Have you used the Teach to Pitch script?' },
    'prompt-3-content.html':       { stepId:'p4',    text:'Have you defined your Content Style with Prompt 4?' },
    'prompt-4-5-forms.html':       { stepId:'p5',    text:'Have you set up your Lead Collection Form?' },
    'prompt-6-feedback.html':      { stepId:'p6',    text:'Have you collected student feedback yet?' },
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function getSession()   { try { return JSON.parse(localStorage.getItem('pac-swift-session')||'null'); } catch(e){return null;} }
  function getUsers()     { try { return JSON.parse(localStorage.getItem('pac-swift-users')||'{}'); } catch(e){return {};} }
  function getProgress(u) { try { return JSON.parse(localStorage.getItem('pac-swift-progress-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveProgress(u,p){ localStorage.setItem('pac-swift-progress-'+(u||'guest'), JSON.stringify(p)); }
  function getActions(u)  { try { return JSON.parse(localStorage.getItem('pac-swift-actions-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveActions(u,a){ localStorage.setItem('pac-swift-actions-'+(u||'guest'), JSON.stringify(a)); }
  function getResults(u)  { try { return JSON.parse(localStorage.getItem('pac-swift-results-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveResults(u,r){ localStorage.setItem('pac-swift-results-'+(u||'guest'), JSON.stringify(r)); }

  // ── TASK STORAGE ─────────────────────────────────────────────────────────
  function getTasks(u)    { try { return JSON.parse(localStorage.getItem('pac-swift-tasks-'+(u||'guest'))||'[]'); } catch(e){return[];} }
  function saveTasks(u,t) { localStorage.setItem('pac-swift-tasks-'+(u||'guest'), JSON.stringify(t)); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function fmtDateLabel(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-SG', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  }
  function getTaskPoints(u) {
    var tasks = getTasks(u);
    var pts = 0;
    tasks.forEach(function(t){ pts += TASK_PTS_ADD; if (t.done) pts += TASK_PTS_DONE; });
    return pts;
  }

  // ── POINTS ────────────────────────────────────────────────────────────────
  function getDone(u) {
    var p = getProgress(u);
    return STEPS.filter(function(s){ return p[s.id]; }).length;
  }
  function getPct(u) {
    return Math.round(getDone(u) / STEPS.length * 100);
  }
  function getStepPoints(u) {
    var prog = getProgress(u), acts = getActions(u), ress = getResults(u), total = 0;
    STEPS.forEach(function(s){
      if (acts[s.id]) total += s.pts.action;
      if (prog[s.id]) total += s.pts.done;
      if (ress[s.id]) total += s.pts.result;
    });
    return total;
  }
  function getTotalPoints(u) {
    return getStepPoints(u) + getTaskPoints(u);
  }

  function getDisplayName(u) {
    try { var d=JSON.parse(localStorage.getItem('pac-swift-users')||'{}'); return (d[u]&&d[u].displayName)||u; } catch(e){ return u; }
  }
  function getAvatarColor(name) {
    var colors = ['#0ABFBC','#4A8FE7','#8B5CF6','#F59E0B','#10B981','#EC4899','#6366F1'];
    var h=0; for(var i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
    return colors[Math.abs(h)%colors.length];
  }
  function currentPage() { return window.location.pathname.split('/').pop() || 'index.html'; }
  function fmtPts(n) { return n.toLocaleString() + ' pts'; }

  // ── CSS ──────────────────────────────────────────────────────────────────
  var CSS = `
    /* ── PROGRESS STRIP ── */
    .pac-ps { background:linear-gradient(180deg,#0d1520 0%,#0f1c2e 100%); border-bottom:1.5px solid rgba(10,191,188,0.25); padding:0 20px; position:sticky; top:44px; z-index:89; flex-shrink:0; }
    .pac-ps-main { display:flex; align-items:center; gap:10px; height:46px; min-width:0; }
    .pac-ps-identity { display:flex; align-items:center; gap:7px; flex-shrink:0; }
    .pac-ps-av { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:white; flex-shrink:0; }
    .pac-ps-name { font-size:12px; font-weight:700; color:rgba(255,255,255,0.85); white-space:nowrap; max-width:80px; overflow:hidden; text-overflow:ellipsis; }
    .pac-ps-rank { display:inline-flex; align-items:center; gap:3px; border-radius:99px; padding:2px 8px; font-size:10px; font-weight:700; white-space:nowrap; flex-shrink:0; border:1px solid; margin-top:2px; }
    .pac-ps-divider { width:1px; height:24px; background:rgba(255,255,255,0.1); flex-shrink:0; }
    .pac-ps-progress { display:flex; align-items:center; gap:7px; flex:1; min-width:0; max-width:220px; }
    .pac-ps-bar-wrap { flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden; }
    .pac-ps-bar { height:100%; border-radius:99px; background:linear-gradient(90deg,#0ABFBC,#4A8FE7); transition:width 0.6s ease; box-shadow:0 0 8px rgba(10,191,188,0.5); }
    .pac-ps-count { font-size:11px; font-weight:600; color:rgba(255,255,255,0.45); white-space:nowrap; flex-shrink:0; }
    .pac-ps-pts { font-size:16px; font-weight:800; color:#0ABFBC; white-space:nowrap; flex-shrink:0; letter-spacing:0.3px; text-shadow:0 0 10px rgba(10,191,188,0.5); }
    .pac-ps-actions { display:flex; gap:6px; flex-shrink:0; margin-left:auto; }
    .pac-ps-btn { background:rgba(10,191,188,0.15); border:1px solid rgba(10,191,188,0.35); color:#0ABFBC; border-radius:7px; padding:5px 11px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
    .pac-ps-btn:hover { background:rgba(10,191,188,0.28); }
    .pac-ps-btn-task { background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; }
    .pac-ps-btn-task:hover { background:rgba(245,158,11,0.25); }
    /* Cohort row */
    .pac-ps-cohort-row { display:flex; align-items:center; gap:8px; padding:4px 0 6px; border-top:1px solid rgba(255,255,255,0.06); overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .pac-ps-cohort-row::-webkit-scrollbar { display:none; }
    .pac-ps-cohort-label { font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.3); white-space:nowrap; flex-shrink:0; }
    .pac-ps-member { display:flex; align-items:center; gap:4px; flex-shrink:0; }
    .pac-ps-member-av { width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:700; color:white; flex-shrink:0; }
    .pac-ps-member-name { font-size:10px; font-weight:600; color:rgba(255,255,255,0.55); white-space:nowrap; }
    .pac-ps-member-track { width:50px; height:4px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; flex-shrink:0; }
    .pac-ps-member-fill { height:100%; border-radius:99px; transition:width 0.6s ease; }
    .pac-ps-member-pts-label { font-size:10px; font-weight:700; white-space:nowrap; flex-shrink:0; }
    @media(max-width:768px) { .pac-ps { top:0; padding:0 12px; } .pac-ps-main { height:42px; gap:8px; } .pac-ps-name { max-width:60px; } .pac-ps-progress { max-width:none; flex:1; } .pac-ps-divider { display:none; } }
    @media(max-width:480px) { .pac-ps-count { display:none; } .pac-ps-name { display:none; } }
    /* rank panel in modal */
    .pac-pm-rank-panel { background:#F4F7FB; border:1.5px solid #E8EDF5; border-radius:12px; padding:14px 18px; margin:0 28px 0; }
    .pac-pm-rank-current { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .pac-pm-rank-badge { font-size:22px; }
    .pac-pm-rank-name { font-size:16px; font-weight:700; color:#002D6A; }
    .pac-pm-rank-desc { font-size:12px; color:#6B7A96; margin-top:1px; }
    .pac-pm-rank-next { font-size:12px; color:#6B7A96; margin-bottom:6px; }
    .pac-pm-rank-next strong { color:#002D6A; }
    .pac-pm-rank-bar-track { height:8px; background:#E8EDF5; border-radius:99px; overflow:hidden; }
    .pac-pm-rank-bar-fill { height:100%; border-radius:99px; transition:width 0.8s ease; }
    .pac-ps-cohort { display:flex; align-items:center; gap:16px; flex:1; overflow:hidden; }
    .pac-ps-member { display:flex; align-items:center; gap:5px; flex-shrink:0; }
    .pac-ps-member-av { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:white; flex-shrink:0; }
    .pac-ps-member-name { font-size:11px; font-weight:600; color:rgba(255,255,255,0.7); white-space:nowrap; }
    .pac-ps-member-track { width:70px; height:7px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden; flex-shrink:0; }
    .pac-ps-member-fill { height:100%; border-radius:99px; transition:width 0.6s ease; }
    .pac-ps-member-pts-label { font-size:11px; font-weight:800; white-space:nowrap; flex-shrink:0; }
    @media(max-width:900px) { .pac-ps-member-track { width:50px; } }
    @media(max-width:768px) { .pac-ps { top:0; padding:8px 14px 10px; } .pac-ps-bar-wrap { flex:1 1 auto; min-width:0; } .pac-ps-cohort { gap:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; } .pac-ps-cohort::-webkit-scrollbar { display:none; } }

    /* ── PROGRESS MODAL ── */
    .pac-pm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:900; display:none; align-items:flex-start; justify-content:center; padding:20px; overflow-y:auto; }
    .pac-pm-overlay.open { display:flex; }
    .pac-pm { background:#fff; border-radius:20px; width:100%; max-width:600px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.3); margin:auto; }
    .pac-pm-head { background:linear-gradient(135deg,#0A0F1C,#111827); padding:22px 28px; display:flex; align-items:center; justify-content:space-between; }
    .pac-pm-head h2 { font-family:'DM Serif Display',serif; font-size:22px; color:white; }
    .pac-pm-head p { font-size:13px; color:rgba(255,255,255,0.5); margin-top:3px; }
    .pac-pm-close { background:none; border:none; color:rgba(255,255,255,0.5); font-size:22px; cursor:pointer; }
    .pac-pm-hero { padding:18px 28px; background:linear-gradient(135deg,rgba(10,191,188,0.06),rgba(74,143,231,0.06)); border-bottom:1px solid #E8EDF5; display:flex; align-items:center; gap:20px; }
    .pac-pm-hero-left { text-align:center; flex-shrink:0; }
    .pac-pm-big-pts { font-family:'DM Serif Display',serif; font-size:42px; color:#0ABFBC; line-height:1; }
    .pac-pm-big-pts-label { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6B7A96; margin-top:2px; }
    .pac-pm-hero-right { flex:1; }
    .pac-pm-hero-bar-track { height:10px; background:#E8EDF5; border-radius:99px; overflow:hidden; margin-bottom:8px; }
    .pac-pm-hero-bar { height:100%; background:linear-gradient(90deg,#0ABFBC,#4A8FE7); border-radius:99px; transition:width 0.8s ease; }
    .pac-pm-hero-sub { font-size:13px; color:#6B7A96; }
    .pac-pm-hero-sub strong { color:#002D6A; }
    .pac-pm-hero-rank { font-size:12px; font-weight:700; color:#8B5CF6; margin-top:4px; }
    .pac-pm-body { padding:18px 28px 24px; }
    .pac-pm-cat { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6B7A96; margin:16px 0 10px; }
    .pac-pm-cat:first-child { margin-top:0; }
    .pac-pm-steps { display:flex; flex-direction:column; gap:8px; }
    .pac-pm-step { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; border-radius:10px; border:1.5px solid #E8EDF5; transition:all 0.15s; background:#F4F7FB; }
    .pac-pm-step.has-done { background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.25); }
    .pac-pm-step-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:white; flex-shrink:0; margin-top:1px; }
    .pac-pm-step-text { flex:1; min-width:0; }
    .pac-pm-step-label { font-size:13px; font-weight:700; color:#002D6A; }
    .pac-pm-step-desc  { font-size:11px; color:#6B7A96; margin-top:1px; margin-bottom:8px; }
    .pac-pm-badges { display:flex; gap:6px; flex-wrap:wrap; }
    .pac-badge { border:none; border-radius:7px; padding:5px 10px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s; opacity:0.45; }
    .pac-badge span { font-weight:400; opacity:0.8; }
    .pac-badge.active { opacity:1; }
    .pac-badge-action { background:rgba(99,102,241,0.12); color:#6366F1; border:1.5px solid rgba(99,102,241,0.25); }
    .pac-badge-action.active { background:rgba(99,102,241,0.18); border-color:#6366F1; box-shadow:0 0 8px rgba(99,102,241,0.3); }
    .pac-badge-action:hover { opacity:1; background:rgba(99,102,241,0.2); }
    .pac-badge-done { background:rgba(16,185,129,0.12); color:#059669; border:1.5px solid rgba(16,185,129,0.25); }
    .pac-badge-done.active { background:rgba(16,185,129,0.18); border-color:#10B981; box-shadow:0 0 8px rgba(16,185,129,0.3); }
    .pac-badge-done:hover { opacity:1; background:rgba(16,185,129,0.2); }
    .pac-badge-result { background:rgba(245,158,11,0.12); color:#D97706; border:1.5px solid rgba(245,158,11,0.25); }
    .pac-badge-result.active { background:rgba(245,158,11,0.18); border-color:#F59E0B; box-shadow:0 0 8px rgba(245,158,11,0.35); }
    .pac-badge-result:hover { opacity:1; background:rgba(245,158,11,0.2); }
    .pac-pm-step-pts { font-size:12px; font-weight:800; color:#0ABFBC; white-space:nowrap; flex-shrink:0; margin-top:2px; min-width:44px; text-align:right; }
    .pac-pm-step-pts.zero { color:#B8C4D4; }
    .pac-pm-social { background:#F4F7FB; border-top:1px solid #E8EDF5; padding:16px 28px; }
    .pac-pm-social h3 { font-size:13px; font-weight:700; color:#002D6A; margin-bottom:10px; }
    .pac-pm-member-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #E8EDF5; }
    .pac-pm-member-row:last-child { border-bottom:none; }
    .pac-pm-member-av { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; flex-shrink:0; }
    .pac-pm-member-name { flex:0 0 72px; font-size:13px; font-weight:600; color:#002D6A; }
    .pac-pm-member-bar-wrap { flex:1; height:6px; background:#E8EDF5; border-radius:99px; overflow:hidden; }
    .pac-pm-member-bar { height:100%; border-radius:99px; }
    .pac-pm-member-pts { font-size:12px; font-weight:800; color:#6B7A96; flex:0 0 56px; text-align:right; }

    /* ── TASK MODAL ── */
    .pac-tm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:901; display:none; align-items:flex-start; justify-content:center; padding:20px; overflow-y:auto; }
    .pac-tm-overlay.open { display:flex; }
    .pac-tm { background:#fff; border-radius:20px; width:100%; max-width:540px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.35); margin:auto; }
    .pac-tm-head { background:linear-gradient(135deg,#1a1200,#2a1f00); padding:20px 24px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .pac-tm-head h2 { font-family:'DM Serif Display',serif; font-size:20px; color:white; }
    .pac-tm-head p { font-size:12px; color:rgba(255,255,255,0.5); margin-top:3px; }
    .pac-tm-close { background:none; border:none; color:rgba(255,255,255,0.5); font-size:20px; cursor:pointer; flex-shrink:0; }
    .pac-tm-pts-info { background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:10px; padding:10px 20px; margin:0 20px; display:flex; gap:20px; justify-content:center; flex-wrap:wrap; }
    .pac-tm-pts-rule { font-size:12px; font-weight:700; color:#92400E; text-align:center; }
    .pac-tm-pts-rule span { display:block; font-size:18px; color:#D97706; font-family:'DM Serif Display',serif; }
    .pac-tm-input-row { display:flex; gap:8px; padding:16px 20px 12px; flex-wrap:wrap; }
    .pac-tm-input { flex:1; min-width:120px; border:1.5px solid #E8EDF5; border-radius:10px; padding:10px 14px; font-family:'DM Sans',sans-serif; font-size:14px; color:#002D6A; outline:none; background:#F4F7FB; }
    .pac-tm-input:focus { border-color:#F59E0B; background:rgba(245,158,11,0.04); }
    .pac-tm-date-input { border:1.5px solid #E8EDF5; border-radius:10px; padding:10px 10px; font-family:'DM Sans',sans-serif; font-size:13px; color:#002D6A; outline:none; background:#F4F7FB; cursor:pointer; }
    .pac-tm-date-input:focus { border-color:#F59E0B; }
    .pac-tm-add-btn { background:#F59E0B; color:white; border:none; border-radius:10px; padding:10px 16px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
    .pac-tm-add-btn:hover { background:#D97706; transform:translateY(-1px); }
    .pac-tm-print-btn { background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.8); border:1px solid rgba(255,255,255,0.25); border-radius:8px; padding:6px 12px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
    .pac-tm-print-btn:hover { background:rgba(255,255,255,0.22); color:white; }
    .pac-tm-list { max-height:360px; overflow-y:auto; padding:0 20px 4px; }
    .pac-tm-date-group { margin-bottom:16px; }
    .pac-tm-date-label { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6B7A96; padding:8px 0 6px; border-bottom:1px solid #E8EDF5; margin-bottom:8px; }
    .pac-tm-task { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1.5px solid #E8EDF5; background:#F4F7FB; margin-bottom:6px; transition:all 0.15s; }
    .pac-tm-task.done { background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.25); }
    .pac-tm-task.done .pac-tm-task-text { text-decoration:line-through; color:#9CA3AF; }
    .pac-tm-check { width:22px; height:22px; border-radius:6px; border:2px solid #B8C4D4; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 0.15s; font-size:12px; color:transparent; }
    .pac-tm-task.done .pac-tm-check { background:#10B981; border-color:#10B981; color:white; }
    .pac-tm-task-text { flex:1; font-size:13px; font-weight:500; color:#002D6A; }
    .pac-tm-task-pts { font-size:11px; font-weight:800; color:#F59E0B; white-space:nowrap; flex-shrink:0; }
    .pac-tm-task.done .pac-tm-task-pts { color:#10B981; }
    .pac-tm-delete { background:none; border:none; color:#B8C4D4; font-size:16px; cursor:pointer; flex-shrink:0; line-height:1; padding:0 2px; }
    .pac-tm-delete:hover { color:#EF4444; }
    .pac-tm-footer { background:#F4F7FB; border-top:1px solid #E8EDF5; padding:14px 20px; display:flex; gap:16px; flex-wrap:wrap; justify-content:space-between; align-items:center; }
    .pac-tm-stat { font-size:12px; color:#6B7A96; }
    .pac-tm-stat strong { color:#002D6A; }
    .pac-tm-empty { text-align:center; padding:32px 20px; color:#6B7A96; font-size:14px; }
    .pac-tm-empty-icon { font-size:36px; margin-bottom:10px; }

    /* SUGGESTION BOX */
    .pac-suggestion { background:linear-gradient(135deg,rgba(10,191,188,0.08),rgba(74,143,231,0.08)); border:1.5px solid rgba(10,191,188,0.3); border-radius:14px; padding:18px 22px; display:flex; align-items:center; gap:16px; margin:20px 0 0; animation:pac-sb-in 0.4s ease; }
    @keyframes pac-sb-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    .pac-suggestion-icon { font-size:28px; flex-shrink:0; }
    .pac-suggestion-body { flex:1; }
    .pac-suggestion-q { font-size:15px; font-weight:700; color:#002D6A; margin-bottom:10px; }
    .pac-suggestion-btns { display:flex; gap:8px; flex-wrap:wrap; }
    .pac-sb-yes { background:#0ABFBC; color:#002D6A; border:none; border-radius:8px; padding:8px 18px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s; }
    .pac-sb-yes:hover { background:#08a8a5; transform:translateY(-1px); }
    .pac-sb-no  { background:rgba(0,0,0,0.06); color:#6B7A96; border:none; border-radius:8px; padding:8px 18px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
    .pac-sb-no:hover { background:rgba(0,0,0,0.1); color:#002D6A; }
    .pac-sb-dismiss { background:none; border:none; color:#B8C4D4; font-size:18px; cursor:pointer; flex-shrink:0; line-height:1; }
  `;

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── RANK BADGE (inline in strip main row) ────────────────────────────────
  function buildCohortHtml(currentUser) {
    if (currentUser === 'johnyeo') return '';
    var users = getUsers();
    var allUsers = Object.keys(users).filter(function(ou){ return ou !== 'johnyeo'; });
    if (allUsers.indexOf(currentUser) === -1) allUsers.push(currentUser);
    if (allUsers.length < 2) return '';

    var ranked = allUsers.map(function(ou){
      return { u: ou, pts: getTotalPoints(ou) };
    }).sort(function(a,b){ return b.pts - a.pts; });

    var myPos = ranked.findIndex(function(r){ return r.u === currentUser; }) + 1;
    var total = ranked.length;
    var myPts = getTotalPoints(currentUser);
    var medals = ['🥇','🥈','🥉'];
    var medal = myPos <= 3 ? medals[myPos-1] : '#' + myPos;

    var above = myPos > 1 ? ranked[myPos-2] : null;
    var below = myPos < total ? ranked[myPos] : null;
    var context = '';
    if (above) {
      var gap = above.pts - myPts;
      context = gap === 0 ? ' · tied' : ' · ▲' + gap + ' pts';
    } else if (below) {
      var lead = myPts - below.pts;
      context = lead === 0 ? ' · tied' : ' · +' + lead + ' lead';
    }

    return '<span id="pacPsRankPos" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);white-space:nowrap;flex-shrink:0;">'
      + medal + ' ' + myPos + '/' + total
      + (context ? '<span style="font-weight:400;color:rgba(255,255,255,0.35);">' + context + '</span>' : '')
      + '</span>';
  }

  // ── RENDER STRIP ─────────────────────────────────────────────────────────
  function renderStrip(session) {
    var u = session ? session.u : null;
    if (!u) return;
    var done = getDone(u), pct = getPct(u), pts = getTotalPoints(u);
    var myRank = getRank(pts);
    var avColor = getAvatarColor(u);
    var dname = getDisplayName(u);
    var cohortHtml = buildCohortHtml(u);

    var strip = document.createElement('div');
    strip.className = 'pac-ps';
    strip.id = 'pacProgressStrip';

    var rankBadge = '<span class="pac-ps-rank" id="pacPsRank" style="color:' + myRank.color + ';border-color:' + myRank.color + '22;background:' + myRank.color + '14;">'
      + myRank.emoji + ' ' + myRank.name + '</span>';

    var mainRow = '<div class="pac-ps-main">'
      + '<div class="pac-ps-identity">'
      + '<div class="pac-ps-av" style="background:' + avColor + ';">' + u.charAt(0).toUpperCase() + '</div>'
      + '<div><div class="pac-ps-name">' + dname + '</div>' + rankBadge + '</div>'
      + '</div>'
      + '<div class="pac-ps-divider"></div>'
      + '<div class="pac-ps-progress">'
      + '<div class="pac-ps-bar-wrap"><div class="pac-ps-bar" id="pacPsBar" style="width:' + pct + '%"></div></div>'
      + '<span class="pac-ps-count" id="pacPsCount">' + done + '/' + STEPS.length + '</span>'
      + (cohortHtml ? cohortHtml : '')
      + '</div>'
      + '<span class="pac-ps-pts" id="pacPsPts">' + fmtPts(pts) + '</span>'
      + '<div class="pac-ps-actions">'
      + '<button class="pac-ps-btn" onclick="window.__pacOpenModal()">📊 Progress</button>'
      + '<button class="pac-ps-btn pac-ps-btn-task" onclick="window.__pacOpenTaskModal()">📋 Tasks</button>'
      + (u !== 'johnyeo' ? '<a class="pac-ps-btn" href="leaderboard.html" style="text-decoration:none;">🏆 Board</a>' : '')
      + '</div>'
      + '</div>';

    strip.innerHTML = mainRow;

    var insertAfter = document.querySelector('.mobile-menu-bar') || document.querySelector('.swift-nav');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(strip, insertAfter.nextSibling);
    }
  }

  // ── RENDER PROGRESS MODAL ────────────────────────────────────────────────
  function buildModalStepsHtml(u) {
    var prog = getProgress(u), acts = getActions(u), ress = getResults(u);
    function buildStepHtml(s) {
      var isAction=!!acts[s.id], isDone=!!prog[s.id], isResult=!!ress[s.id];
      var stepPts = (isAction?s.pts.action:0)+(isDone?s.pts.done:0)+(isResult?s.pts.result:0);
      return '<div class="pac-pm-step' + (isDone?' has-done':'') + '" id="pacStep-' + s.id + '">'
        + '<div class="pac-pm-step-icon" style="background:' + s.color + ';">' + s.short + '</div>'
        + '<div class="pac-pm-step-text">'
        + '<div class="pac-pm-step-label">' + s.label + '</div>'
        + '<div class="pac-pm-step-desc">' + s.desc + '</div>'
        + '<div class="pac-pm-badges">'
        + '<button class="pac-badge pac-badge-action' + (isAction?' active':'') + '" onclick="window.__pacToggleAction(\'' + s.id + '\')">📅 Action <span>+' + s.pts.action + '</span></button>'
        + '<button class="pac-badge pac-badge-done'   + (isDone?  ' active':'') + '" onclick="window.__pacToggleStep(\''   + s.id + '\')">✅ Done <span>+' + s.pts.done + '</span></button>'
        + '<button class="pac-badge pac-badge-result' + (isResult?' active':'') + '" onclick="window.__pacToggleResult(\'' + s.id + '\')">🏆 Result <span>+' + s.pts.result + '</span></button>'
        + '</div></div>'
        + '<div class="pac-pm-step-pts' + (stepPts?'':' zero') + '" id="pacStepPts-' + s.id + '">' + (stepPts||'—') + (stepPts?' pts':'') + '</div>'
        + '</div>';
    }
    var swiftSteps = STEPS.filter(function(s){ return s.cat==='SWIFT'; });
    var aiSteps    = STEPS.filter(function(s){ return s.cat==='AI'; });
    return { swift: swiftSteps.map(buildStepHtml).join(''), ai: aiSteps.map(buildStepHtml).join('') };
  }

  function renderModal(session) {
    var u = session ? session.u : null;
    if (!u) return;
    var done=getDone(u), pct=getPct(u), pts=getTotalPoints(u);
    var stepsHtml = buildModalStepsHtml(u);

    var users = getUsers();
    var allMembers = Object.keys(users).filter(function(ou){ return ou !== u && ou !== 'johnyeo'; }).slice(0, 6);
    var maxPts = Math.max.apply(null, allMembers.map(function(ou){ return getTotalPoints(ou); }).concat([pts, 1]));

    var socialHtml = '';
    if (allMembers.length) {
      socialHtml = '<div class="pac-pm-social"><h3>👥 Cohort Points</h3>'
        + allMembers.map(function(ou) {
            var opts=getTotalPoints(ou), opctW=Math.round(opts/maxPts*100), color=getAvatarColor(ou), dname=getDisplayName(ou);
            return '<div class="pac-pm-member-row">'
              + '<div class="pac-pm-member-av" style="background:' + color + ';">' + ou.charAt(0).toUpperCase() + '</div>'
              + '<div class="pac-pm-member-name">' + dname + '</div>'
              + '<div class="pac-pm-member-bar-wrap"><div class="pac-pm-member-bar" style="width:' + opctW + '%;background:' + color + ';"></div></div>'
              + '<div class="pac-pm-member-pts">' + fmtPts(opts) + '</div>'
              + '</div>';
          }).join('')
        + '</div>';
    }

    var modal = document.createElement('div');
    modal.className = 'pac-pm-overlay';
    modal.id = 'pacProgressModal';
    modal.innerHTML =
      '<div class="pac-pm">'
      + '<div class="pac-pm-head"><div><h2>My Progress</h2><p>Earn points · climb the leaderboard</p></div><button class="pac-pm-close" onclick="window.__pacCloseModal()">✕</button></div>'
      + '<div class="pac-pm-hero">'
      + '<div class="pac-pm-hero-left"><div class="pac-pm-big-pts" id="pacPmPts">' + pts + '</div><div class="pac-pm-big-pts-label">points</div></div>'
      + '<div class="pac-pm-hero-right">'
      + '<div class="pac-pm-hero-bar-track"><div class="pac-pm-hero-bar" id="pacPmBar" style="width:' + pct + '%"></div></div>'
      + '<div class="pac-pm-hero-sub"><strong id="pacPmDone">' + done + '</strong> of ' + STEPS.length + ' steps · <strong>' + pct + '%</strong> complete</div>'
      + '<div class="pac-pm-hero-rank" id="pacPmRank"></div>'
      + '</div></div>'
      + '<div id="pacPmRankPanel"></div>'
      + '<div class="pac-pm-body">'
      + '<div class="pac-pm-cat">SWIFT Framework · <span style="font-weight:400;text-transform:none;letter-spacing:0;">📅 Action = commit to calendar &nbsp;✅ Done = completed &nbsp;🏆 Result = got results</span></div>'
      + '<div class="pac-pm-steps" id="pacPmSwiftSteps">' + stepsHtml.swift + '</div>'
      + '<div class="pac-pm-cat">6 AI Prompts</div>'
      + '<div class="pac-pm-steps" id="pacPmAiSteps">' + stepsHtml.ai + '</div>'
      + '</div>'
      + socialHtml
      + '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) window.__pacCloseModal(); });
    updateRank(u);
  }

  // ── TASK MODAL ────────────────────────────────────────────────────────────
  function renderTaskModal() {
    var modal = document.createElement('div');
    modal.className = 'pac-tm-overlay';
    modal.id = 'pacTaskModal';
    modal.innerHTML = '<div class="pac-tm" id="pacTaskInner"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) window.__pacCloseTaskModal(); });
  }

  function refreshTaskModal(u) {
    var inner = document.getElementById('pacTaskInner');
    if (!inner) return;
    var tasks  = getTasks(u);
    var today  = todayStr();

    var dateMap = {};
    tasks.forEach(function(t){ if (!dateMap[t.date]) dateMap[t.date]=[];  dateMap[t.date].push(t); });
    var dates = Object.keys(dateMap).sort().reverse();

    var todayTasks   = dateMap[today] || [];
    var todayAdded   = todayTasks.length;
    var todayDone    = todayTasks.filter(function(t){ return t.done; }).length;
    var todayPts     = todayTasks.reduce(function(s,t){ return s + TASK_PTS_ADD + (t.done?TASK_PTS_DONE:0); }, 0);
    var totalTaskPts = getTaskPoints(u);
    var totalTasks   = tasks.length;
    var totalDone    = tasks.filter(function(t){ return t.done; }).length;

    var listHtml = '';
    if (dates.length === 0) {
      listHtml = '<div class="pac-tm-empty"><div class="pac-tm-empty-icon">📋</div>No tasks yet — add your first one above!</div>';
    } else {
      dates.forEach(function(dateStr) {
        var label = dateStr === today ? 'Today · ' + fmtDateLabel(dateStr) : fmtDateLabel(dateStr);
        listHtml += '<div class="pac-tm-date-group"><div class="pac-tm-date-label">' + label + '</div>';
        dateMap[dateStr].forEach(function(t) {
          var taskPts = TASK_PTS_ADD + (t.done ? TASK_PTS_DONE : 0);
          listHtml += '<div class="pac-tm-task' + (t.done?' done':'') + '" id="pacTask-' + t.id + '">'
            + '<div class="pac-tm-check" onclick="window.__pacToggleTask(\'' + t.id + '\')">✓</div>'
            + '<span class="pac-tm-task-text">' + t.text.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>'
            + '<span class="pac-tm-task-pts">' + taskPts + ' pts</span>'
            + '<button class="pac-tm-delete" onclick="window.__pacDeleteTask(\'' + t.id + '\')" title="Remove">✕</button>'
            + '</div>';
        });
        listHtml += '</div>';
      });
    }

    inner.innerHTML =
      '<div class="pac-tm-head">'
      + '<div><h2>📋 Daily Tasks</h2><p>Set tasks, take action, earn points — no limits!</p></div>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<button class="pac-tm-print-btn" onclick="window.__pacPrintTasks()" title="Print / Save as PDF">🖨️ Print PDF</button>'
      + '<button class="pac-tm-close" onclick="window.__pacCloseTaskModal()">✕</button>'
      + '</div>'
      + '</div>'
      + '<div class="pac-tm-pts-info">'
      + '<div class="pac-tm-pts-rule"><span>+' + TASK_PTS_ADD + '</span>per task set</div>'
      + '<div class="pac-tm-pts-rule"><span>+' + TASK_PTS_DONE + '</span>per task done</div>'
      + '<div class="pac-tm-pts-rule"><span>=' + (TASK_PTS_ADD+TASK_PTS_DONE) + '</span>per completed task</div>'
      + '</div>'
      + '<div class="pac-tm-input-row">'
      + '<input class="pac-tm-input" id="pacTaskInput" type="text" placeholder="Add a task…" maxlength="120" />'
      + '<input class="pac-tm-date-input" id="pacTaskDate" type="date" value="' + today + '" title="Task date" />'
      + '<button class="pac-tm-add-btn" onclick="window.__pacAddTask()">+ Add</button>'
      + '</div>'
      + '<div class="pac-tm-list">' + listHtml + '</div>'
      + '<div class="pac-tm-footer">'
      + '<span class="pac-tm-stat">Today: <strong>' + todayAdded + '</strong> set · <strong>' + todayDone + '</strong> done · <strong>' + todayPts + ' pts</strong></span>'
      + '<span class="pac-tm-stat">All time: <strong>' + totalTasks + '</strong> tasks · <strong>' + totalDone + '</strong> done · <strong>' + totalTaskPts + ' pts</strong></span>'
      + '</div>';

    setTimeout(function(){ var inp=document.getElementById('pacTaskInput'); if(inp) inp.focus(); }, 50);
    var inp = document.getElementById('pacTaskInput');
    if (inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter') window.__pacAddTask(); });
  }

  // ── RANK ─────────────────────────────────────────────────────────────────
  function updateRank(u) {
    var pts = getTotalPoints(u);

    var el = document.getElementById('pacPmRank');
    if (el) {
      var users = getUsers();
      var all   = Object.keys(users).filter(function(x){ return x !== 'johnyeo'; });
      if (all.indexOf(u) === -1) all.push(u);
      var ranked = all.map(function(ou){ return getTotalPoints(ou); }).sort(function(a,b){ return b-a; });
      var pos = ranked.indexOf(pts) + 1;
      el.textContent = pos ? '🏅 Rank #' + pos + ' of ' + all.length : '';
    }

    var panel = document.getElementById('pacPmRankPanel');
    if (!panel) return;
    var cur  = getRank(pts);
    var next = getNextRank(pts);
    var pctToNext = next ? Math.round((pts - cur.min) / (next.min - cur.min) * 100) : 100;
    var ptsToNext = next ? (next.min - pts) : 0;

    panel.innerHTML = '<div class="pac-pm-rank-panel">'
      + '<div class="pac-pm-rank-current">'
      + '<div class="pac-pm-rank-badge">' + cur.emoji + '</div>'
      + '<div><div class="pac-pm-rank-name" style="color:' + cur.color + ';">' + cur.name + '</div><div class="pac-pm-rank-desc">' + cur.desc + '</div></div>'
      + '</div>'
      + (next
        ? '<div class="pac-pm-rank-next">Next rank: <strong>' + next.emoji + ' ' + next.name + '</strong> — ' + ptsToNext.toLocaleString() + ' pts to go</div>'
          + '<div class="pac-pm-rank-bar-track"><div class="pac-pm-rank-bar-fill" style="width:' + pctToNext + '%;background:' + cur.color + ';box-shadow:0 0 8px ' + cur.color + '66;"></div></div>'
        : '<div class="pac-pm-rank-next" style="color:' + cur.color + ';font-weight:700;">🎉 Maximum rank achieved — you\'re a SWIFT Master!</div>')
      + '</div>';

    var stripRank = document.getElementById('pacPsRank');
    if (stripRank) {
      stripRank.textContent = cur.emoji + ' ' + cur.name;
      stripRank.style.color = cur.color;
      stripRank.style.borderColor = cur.color + '33';
      stripRank.style.background  = cur.color + '18';
    }
  }

  // ── SUGGESTION BOX ───────────────────────────────────────────────────────
  function renderSuggestion(session) {
    var u = session ? session.u : null;
    var page = currentPage();
    var sug = SUGGESTIONS[page];
    if (!sug) return;
    var prog = getProgress(u);
    if (prog[sug.stepId]) return;
    if (localStorage.getItem('pac-sug-dismiss-' + page)) return;

    var box = document.createElement('div');
    box.className = 'pac-suggestion';
    box.id = 'pacSuggestion';
    box.innerHTML =
      '<div class="pac-suggestion-icon">💡</div>'
      + '<div class="pac-suggestion-body">'
      + '<div class="pac-suggestion-q">' + sug.text + '</div>'
      + '<div class="pac-suggestion-btns">'
      + '<button class="pac-sb-yes" onclick="window.__pacSugYes(\'' + sug.stepId + '\')">✓ Done it!</button>'
      + '<button class="pac-sb-no"  onclick="window.__pacSugNo()">Working on it</button>'
      + '</div></div>'
      + '<button class="pac-sb-dismiss" onclick="window.__pacSugDismiss()" title="Dismiss">✕</button>';

    var main = document.querySelector('.main') || document.querySelector('main') || document.querySelector('.page-content');
    if (main) main.insertBefore(box, main.firstChild);
  }

  // ── TOGGLE STEP FUNCTIONS ─────────────────────────────────────────────────
  window.__pacToggleStep = function(stepId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var prog=getProgress(u); prog[stepId]=!prog[stepId]; saveProgress(u,prog);
    refreshUI(u);
    syncUserToFirebase(u);
    if (prog[stepId]) { var box=document.getElementById('pacSuggestion'); if(box) box.remove(); }
  };
  window.__pacToggleAction = function(stepId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var acts=getActions(u); acts[stepId]=!acts[stepId]; saveActions(u,acts);
    refreshUI(u);
    syncUserToFirebase(u);
  };
  window.__pacToggleResult = function(stepId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var ress=getResults(u); ress[stepId]=!ress[stepId]; saveResults(u,ress);
    refreshUI(u);
    syncUserToFirebase(u);
  };

  // ── TASK FUNCTIONS ────────────────────────────────────────────────────────
  window.__pacAddTask = function() {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var inp=document.getElementById('pacTaskInput'); if(!inp) return;
    var text=inp.value.trim(); if(!text) return;
    var dateInp=document.getElementById('pacTaskDate');
    var taskDate = (dateInp && dateInp.value) ? dateInp.value : todayStr();
    var tasks=getTasks(u);
    tasks.unshift({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,5), text:text, date:taskDate, created:Date.now(), done:false, doneAt:null });
    saveTasks(u,tasks);
    inp.value='';
    refreshUI(u);
    refreshTaskModal(u);
    syncUserToFirebase(u);
  };

  window.__pacPrintTasks = function() {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var tasks=getTasks(u);
    if (!tasks.length) { alert('No tasks to print yet!'); return; }
    var map={};
    tasks.forEach(function(t){ if(!map[t.date]) map[t.date]=[]; map[t.date].push(t); });
    var dates=Object.keys(map).sort();
    var rows='';
    dates.forEach(function(d){
      var label=fmtDateLabel(d);
      rows+='<tr><td colspan="3" style="background:#002D6A;color:white;padding:8px 12px;font-weight:700;font-size:13px;">'+label+'</td></tr>';
      map[d].forEach(function(t,i){
        var pts=5+(t.done?20:0);
        rows+='<tr>'
          +'<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;'+(t.done?'text-decoration:line-through;color:#6B7A96;':'color:#0A0F1C;')+'">'+(i+1)+'. '+t.text.replace(/</g,'&lt;')+'</td>'
          +'<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#6B7A96;white-space:nowrap;">'+(t.done?'✅ Done':'⬜ To do')+'</td>'
          +'<td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#0ABFBC;text-align:right;font-weight:700;">+'+pts+' pts</td>'
          +'</tr>';
      });
    });
    var totalPts=tasks.reduce(function(s,t){return s+5+(t.done?20:0);},0);
    var dateLabel = new Date().toLocaleDateString('en-SG', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Daily Tasks \u2014 ' + u + '</title>'
      + '<style>body{font-family:Arial,sans-serif;margin:32px;color:#0A0F1C;}h1{font-size:22px;margin-bottom:4px;}p{color:#6B7A96;font-size:13px;margin-bottom:24px;}table{width:100%;border-collapse:collapse;}@media print{button{display:none;}}</style>'
      + '</head><body>'
      + '<h1>\uD83D\uDCCB Daily Tasks \u2014 ' + u + '</h1>'
      + '<p>Printed on ' + dateLabel + '</p>'
      + '<button onclick="window.print()" style="background:#0ABFBC;color:#002D6A;border:none;padding:8px 18px;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:20px;font-size:13px;">Print</button>'
      + '<table>' + rows + '</table>'
      + '<p style="margin-top:20px;font-weight:700;font-size:14px;">Total: ' + totalPts + ' pts</p>'
      + '</body></html>');
    win.document.close();
  };

  window.__pacToggleTask = function(taskId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var tasks=getTasks(u);
    tasks=tasks.map(function(t){ if(t.id===taskId){ t.done=!t.done; t.doneAt=t.done?Date.now():null; } return t; });
    saveTasks(u,tasks);
    refreshUI(u);
    refreshTaskModal(u);
    syncUserToFirebase(u);
  };

  window.__pacDeleteTask = function(taskId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var tasks=getTasks(u).filter(function(t){ return t.id!==taskId; });
    saveTasks(u,tasks);
    refreshUI(u);
    refreshTaskModal(u);
    syncUserToFirebase(u);
  };

  // ── MODAL OPEN/CLOSE ──────────────────────────────────────────────────────
  window.__pacOpenModal = function() { var m=document.getElementById('pacProgressModal'); if(m) m.classList.add('open'); };
  window.__pacCloseModal = function() { var m=document.getElementById('pacProgressModal'); if(m) m.classList.remove('open'); };
  window.__pacOpenTaskModal = function() {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    refreshTaskModal(u);
    var m=document.getElementById('pacTaskModal'); if(m) m.classList.add('open');
  };
  window.__pacCloseTaskModal = function() { var m=document.getElementById('pacTaskModal'); if(m) m.classList.remove('open'); };

  // ── REFRESH UI ────────────────────────────────────────────────────────────
  function refreshUI(u) {
    var prog=getProgress(u), acts=getActions(u), ress=getResults(u);
    var done=getDone(u), pct=getPct(u), pts=getTotalPoints(u);

    var bar=document.getElementById('pacPsBar'); if(bar) bar.style.width=pct+'%';
    var countEl=document.getElementById('pacPsCount'); if(countEl) countEl.textContent=done+'/'+STEPS.length;
    var ptsEl=document.getElementById('pacPsPts'); if(ptsEl) ptsEl.textContent=fmtPts(pts);

    var pmPts=document.getElementById('pacPmPts'); if(pmPts) pmPts.textContent=pts;
    var pmBar=document.getElementById('pacPmBar'); if(pmBar) pmBar.style.width=pct+'%';
    var pmDone=document.getElementById('pacPmDone'); if(pmDone) pmDone.textContent=done;
    updateRank(u);

    STEPS.forEach(function(s) {
      var el=document.getElementById('pacStep-'+s.id); if(!el) return;
      var isAction=!!acts[s.id], isDone=!!prog[s.id], isResult=!!ress[s.id];
      var stepPts=(isAction?s.pts.action:0)+(isDone?s.pts.done:0)+(isResult?s.pts.result:0);
      el.className='pac-pm-step'+(isDone?' has-done':'');
      var badges=el.querySelectorAll('.pac-badge');
      if(badges[0]) badges[0].className='pac-badge pac-badge-action'+(isAction?' active':'');
      if(badges[1]) badges[1].className='pac-badge pac-badge-done'+(isDone?' active':'');
      if(badges[2]) badges[2].className='pac-badge pac-badge-result'+(isResult?' active':'');
      var sp=document.getElementById('pacStepPts-'+s.id);
      if(sp){ sp.textContent=stepPts?stepPts+' pts':'—'; sp.className='pac-pm-step-pts'+(stepPts?'':' zero'); }
    });
  }

  // ── SUGGESTION ACTIONS ────────────────────────────────────────────────────
  window.__pacSugYes = function(stepId) {
    var session=getSession(); var u=session?session.u:null; if(!u) return;
    var prog=getProgress(u); prog[stepId]=true; saveProgress(u,prog);
    refreshUI(u);
    syncUserToFirebase(u);
    var box=document.getElementById('pacSuggestion');
    if(box){ box.innerHTML='<div class="pac-suggestion-icon">🎉</div><div class="pac-suggestion-body"><div class="pac-suggestion-q" style="color:#065f46;">Awesome — marked as done! Keep going.</div></div>'; setTimeout(function(){ if(box.parentNode) box.remove(); },2500); }
  };
  window.__pacSugNo = function() {
    var box=document.getElementById('pacSuggestion');
    if(box){ box.innerHTML='<div class="pac-suggestion-icon">💪</div><div class="pac-suggestion-body"><div class="pac-suggestion-q" style="color:#1e3a5f;">No worries — come back and tick it off when done!</div></div>'; setTimeout(function(){ if(box.parentNode) box.remove(); },2500); }
    localStorage.setItem('pac-sug-dismiss-'+currentPage(),'1');
  };
  window.__pacSugDismiss = function() {
    var box=document.getElementById('pacSuggestion'); if(box) box.remove();
    localStorage.setItem('pac-sug-dismiss-'+currentPage(),'1');
  };

  // ── GLOBAL REFRESH ────────────────────────────────────────────────────────
  window.__pacRefreshStrip = function() {
    var session = getSession();
    if (session && session.u) {
      refreshUI(session.u);
      var tm = document.getElementById('pacTaskModal');
      if (tm && tm.classList.contains('open')) refreshTaskModal(session.u);
    }
  };

  // ── PRESENCE ─────────────────────────────────────────────────────────────
  function updatePresence(u) {
    if (!u) return;
    var page = currentPage();
    var pageTitle = document.title || page;
    fetch(FB_DB_URL + '/presence/' + u + '.json?auth=' + FB_SECRET, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastSeen: new Date().toISOString(), page: page, title: pageTitle })
    }).catch(function() {});
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    var session=getSession();
    if (!session||!session.u) return;
    if (!localStorage.getItem('pac-swift-user')) {
      localStorage.setItem('pac-swift-user', session.u);
    }
    var nm = document.getElementById('nameModal');
    if (nm) nm.style.display = 'none';

    // Load latest data from Firebase, then render + sync analytics
    loadUserFromFirebase(session.u, function() {
      renderStrip(session);
      renderModal(session);
      renderTaskModal();
      renderSuggestion(session);
      syncAnalyticsToFirebase(session.u);
      // Presence: update now, then every 60s while page is open
      updatePresence(session.u);
      setInterval(function() { updatePresence(session.u); }, 60000);
    });
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
