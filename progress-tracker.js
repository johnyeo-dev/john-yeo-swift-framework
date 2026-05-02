// ── PAC SWIFT PROGRESS TRACKER ──────────────────────────────────────────────
// Self-injecting progress strip, modal, social proof, and page suggestions
(function() {
  'use strict';

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

  // Max possible points: SWIFT = 5×250=1250, AI = 6×125=750 → total 2000
  var MAX_PTS = STEPS.reduce(function(sum,s){ return sum+s.pts.action+s.pts.done+s.pts.result; }, 0);

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
  function getSession()  { try { return JSON.parse(localStorage.getItem('pac-swift-session')||'null'); } catch(e){return null;} }
  function getUsers()    { try { return JSON.parse(localStorage.getItem('pac-swift-users')||'{}'); } catch(e){return {};} }

  function getProgress(u) { try { return JSON.parse(localStorage.getItem('pac-swift-progress-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveProgress(u,p){ localStorage.setItem('pac-swift-progress-'+(u||'guest'), JSON.stringify(p)); }

  function getActions(u)  { try { return JSON.parse(localStorage.getItem('pac-swift-actions-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveActions(u,a){ localStorage.setItem('pac-swift-actions-'+(u||'guest'), JSON.stringify(a)); }

  function getResults(u)  { try { return JSON.parse(localStorage.getItem('pac-swift-results-'+(u||'guest'))||'{}'); } catch(e){return{};} }
  function saveResults(u,r){ localStorage.setItem('pac-swift-results-'+(u||'guest'), JSON.stringify(r)); }

  function getDone(u) {
    var p = getProgress(u);
    return STEPS.filter(function(s){ return p[s.id]; }).length;
  }
  function getPct(u) {
    return Math.round(getDone(u) / STEPS.length * 100);
  }
  function getTotalPoints(u) {
    var prog = getProgress(u);
    var acts = getActions(u);
    var ress = getResults(u);
    var total = 0;
    STEPS.forEach(function(s) {
      if (acts[s.id]) total += s.pts.action;
      if (prog[s.id]) total += s.pts.done;
      if (ress[s.id]) total += s.pts.result;
    });
    return total;
  }
  function getDisplayName(u) {
    try { var d=JSON.parse(localStorage.getItem('pac-swift-users')||'{}'); return (d[u]&&d[u].displayName)||u; } catch(e){ return u; }
  }
  function getAvatarColor(name) {
    var colors = ['#0ABFBC','#4A8FE7','#8B5CF6','#F59E0B','#10B981','#EC4899','#6366F1'];
    var h=0; for(var i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
    return colors[Math.abs(h)%colors.length];
  }
  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }
  function fmtPts(n) { return n.toLocaleString() + ' pts'; }

  // ── CSS ──────────────────────────────────────────────────────────────────
  var CSS = `
    /* ── PROGRESS STRIP ── */
    .pac-ps { background:linear-gradient(180deg,#0d1520 0%,#0f1c2e 100%); border-bottom:2px solid rgba(10,191,188,0.35); padding:10px 28px 12px; display:flex; flex-direction:column; gap:9px; position:sticky; top:44px; z-index:89; flex-shrink:0; }
    .pac-ps-row { display:flex; align-items:center; gap:12px; }
    .pac-ps-label { font-size:9px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,255,255,0.4); white-space:nowrap; flex-shrink:0; min-width:52px; }
    .pac-ps-bar-wrap { flex:0 0 180px; height:10px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; flex-shrink:0; }
    .pac-ps-bar { height:100%; border-radius:99px; background:linear-gradient(90deg,#0ABFBC,#4A8FE7); transition:width 0.6s ease; box-shadow:0 0 10px rgba(10,191,188,0.55); }
    .pac-ps-count { font-size:12px; font-weight:700; color:rgba(255,255,255,0.55); white-space:nowrap; flex-shrink:0; }
    .pac-ps-pts { font-size:15px; font-weight:800; color:#0ABFBC; white-space:nowrap; flex-shrink:0; letter-spacing:0.3px; text-shadow:0 0 12px rgba(10,191,188,0.6); }
    .pac-ps-btn { background:rgba(10,191,188,0.18); border:1.5px solid rgba(10,191,188,0.45); color:#0ABFBC; border-radius:8px; padding:5px 13px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:all 0.15s; margin-left:4px; }
    .pac-ps-btn:hover { background:rgba(10,191,188,0.3); box-shadow:0 0 10px rgba(10,191,188,0.3); }
    /* cohort row */
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
    .pac-badge.active { opacity:1; transform:none; }
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

    /* SOCIAL PROOF PANEL in modal */
    .pac-pm-social { background:#F4F7FB; border-top:1px solid #E8EDF5; padding:16px 28px; }
    .pac-pm-social h3 { font-size:13px; font-weight:700; color:#002D6A; margin-bottom:10px; }
    .pac-pm-member-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #E8EDF5; }
    .pac-pm-member-row:last-child { border-bottom:none; }
    .pac-pm-member-av { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; flex-shrink:0; }
    .pac-pm-member-name { flex:0 0 72px; font-size:13px; font-weight:600; color:#002D6A; }
    .pac-pm-member-bar-wrap { flex:1; height:6px; background:#E8EDF5; border-radius:99px; overflow:hidden; }
    .pac-pm-member-bar { height:100%; border-radius:99px; }
    .pac-pm-member-pts { font-size:12px; font-weight:800; color:#6B7A96; flex:0 0 56px; text-align:right; }

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

  // ── INJECT CSS ───────────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── BUILD COHORT HTML (for strip row 2) ──────────────────────────────────
  function buildCohortHtml(excludeUser) {
    var users = getUsers();
    var members = Object.keys(users).filter(function(ou){ return ou !== excludeUser && ou !== 'johnyeo'; });
    members = members.slice(0, 8);
    if (!members.length) return '';
    return members.map(function(ou) {
      var pts   = getTotalPoints(ou);
      var pctW  = MAX_PTS > 0 ? Math.round(pts / MAX_PTS * 100) : 0;
      var color = getAvatarColor(ou);
      var dname = getDisplayName(ou);
      return '<div class="pac-ps-member">'
        + '<div class="pac-ps-member-av" style="background:' + color + ';">' + ou.charAt(0).toUpperCase() + '</div>'
        + '<span class="pac-ps-member-name">' + dname + '</span>'
        + '<div class="pac-ps-member-track"><div class="pac-ps-member-fill" style="width:' + pctW + '%;background:' + color + ';box-shadow:0 0 6px ' + color + '88;"></div></div>'
        + '<span class="pac-ps-member-pts-label" style="color:' + color + ';">' + pts + ' pts</span>'
        + '</div>';
    }).join('');
  }

  // ── RENDER PROGRESS STRIP ────────────────────────────────────────────────
  function renderStrip(session) {
    var u = session ? session.u : null;
    if (!u) return;
    var done  = getDone(u);
    var pts   = getTotalPoints(u);
    var pct   = getPct(u);

    var cohortHtml = buildCohortHtml(u);

    var strip = document.createElement('div');
    strip.className = 'pac-ps';
    strip.id = 'pacProgressStrip';

    // Row 1: my progress
    var row1 = '<div class="pac-ps-row">'
      + '<span class="pac-ps-label">You</span>'
      + '<div class="pac-ps-bar-wrap"><div class="pac-ps-bar" id="pacPsBar" style="width:' + pct + '%"></div></div>'
      + '<span class="pac-ps-count" id="pacPsCount">' + done + '/' + STEPS.length + '</span>'
      + '<span class="pac-ps-pts" id="pacPsPts">' + fmtPts(pts) + '</span>'
      + '<button class="pac-ps-btn" onclick="window.__pacOpenModal()">My Progress</button>'
      + '</div>';

    // Row 2: cohort
    var row2 = cohortHtml
      ? '<div class="pac-ps-row">'
        + '<span class="pac-ps-label">Cohort</span>'
        + '<div class="pac-ps-cohort" id="pacPsCohort">' + cohortHtml + '</div>'
        + '</div>'
      : '';

    strip.innerHTML = row1 + row2;

    var insertAfter = document.querySelector('.mobile-menu-bar') || document.querySelector('.swift-nav');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(strip, insertAfter.nextSibling);
    }
  }

  // ── RENDER MODAL ─────────────────────────────────────────────────────────
  function buildModalStepsHtml(u) {
    var prog = getProgress(u);
    var acts = getActions(u);
    var ress = getResults(u);

    function buildStepHtml(s) {
      var isAction = !!acts[s.id];
      var isDone   = !!prog[s.id];
      var isResult = !!ress[s.id];
      var stepPts  = (isAction?s.pts.action:0) + (isDone?s.pts.done:0) + (isResult?s.pts.result:0);
      var cls = 'pac-pm-step' + (isDone?' has-done':'');
      return '<div class="' + cls + '" id="pacStep-' + s.id + '">'
        + '<div class="pac-pm-step-icon" style="background:' + s.color + ';">' + s.short + '</div>'
        + '<div class="pac-pm-step-text">'
        + '<div class="pac-pm-step-label">' + s.label + '</div>'
        + '<div class="pac-pm-step-desc">' + s.desc + '</div>'
        + '<div class="pac-pm-badges">'
        + '<button class="pac-badge pac-badge-action' + (isAction?' active':'') + '" onclick="window.__pacToggleAction(\'' + s.id + '\')">📅 Action <span>+' + s.pts.action + '</span></button>'
        + '<button class="pac-badge pac-badge-done'   + (isDone?  ' active':'') + '" onclick="window.__pacToggleStep(\''   + s.id + '\')">✅ Done <span>+' + s.pts.done + '</span></button>'
        + '<button class="pac-badge pac-badge-result' + (isResult?' active':'') + '" onclick="window.__pacToggleResult(\'' + s.id + '\')">🏆 Result <span>+' + s.pts.result + '</span></button>'
        + '</div>'
        + '</div>'
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

    var done = getDone(u);
    var pct  = getPct(u);
    var pts  = getTotalPoints(u);
    var pctOfMax = MAX_PTS > 0 ? Math.round(pts / MAX_PTS * 100) : 0;

    var stepsHtml = buildModalStepsHtml(u);

    // Cohort / social proof
    var users = getUsers();
    var allMembers = Object.keys(users).filter(function(ou){ return ou !== u && ou !== 'johnyeo'; }).slice(0, 6);

    var socialHtml = '';
    if (allMembers.length) {
      socialHtml = '<div class="pac-pm-social"><h3>👥 Cohort Points</h3>'
        + allMembers.map(function(ou) {
            var opts  = getTotalPoints(ou);
            var opctW = MAX_PTS > 0 ? Math.round(opts/MAX_PTS*100) : 0;
            var color = getAvatarColor(ou);
            var dname = getDisplayName(ou);
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
      + '<div class="pac-pm-hero-bar-track"><div class="pac-pm-hero-bar" id="pacPmBar" style="width:' + pctOfMax + '%"></div></div>'
      + '<div class="pac-pm-hero-sub"><strong id="pacPmDone">' + done + '</strong> of ' + STEPS.length + ' steps · <strong>' + pct + '%</strong> complete</div>'
      + '<div class="pac-pm-hero-rank" id="pacPmRank"></div>'
      + '</div></div>'
      + '<div class="pac-pm-body">'
      + '<div class="pac-pm-cat">SWIFT Framework · <span style="font-weight:400;text-transform:none;letter-spacing:0;">📅 Action = commit to calendar &nbsp; ✅ Done = completed &nbsp; 🏆 Result = got results</span></div>'
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

  // ── RANK CALCULATION ─────────────────────────────────────────────────────
  function getAllUsers(excludeSelf) {
    var users = getUsers();
    var list  = Object.keys(users).filter(function(u){ return u !== 'johnyeo'; });
    return list;
  }

  function updateRank(u) {
    var el = document.getElementById('pacPmRank');
    if (!el) return;
    var all = getAllUsers();
    var myPts = getTotalPoints(u);
    var ranked = all.map(function(ou){ return getTotalPoints(ou); }).sort(function(a,b){ return b-a; });
    var rank = ranked.indexOf(myPts) + 1;
    el.textContent = rank ? '🏅 Rank #' + rank + ' of ' + all.length : '';
  }

  // ── SUGGESTION BOX ───────────────────────────────────────────────────────
  function renderSuggestion(session) {
    var u = session ? session.u : null;
    var page = currentPage();
    var sug = SUGGESTIONS[page];
    if (!sug) return;

    var prog = getProgress(u);
    if (prog[sug.stepId]) return;

    var dismissKey = 'pac-sug-dismiss-' + page;
    if (localStorage.getItem(dismissKey)) return;

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

  // ── TOGGLE FUNCTIONS ─────────────────────────────────────────────────────
  window.__pacToggleStep = function(stepId) {
    var session = getSession(); var u = session ? session.u : null; if (!u) return;
    var prog = getProgress(u);
    prog[stepId] = !prog[stepId];
    saveProgress(u, prog);
    refreshUI(u);
    if (prog[stepId]) { var box = document.getElementById('pacSuggestion'); if (box) box.remove(); }
  };

  window.__pacToggleAction = function(stepId) {
    var session = getSession(); var u = session ? session.u : null; if (!u) return;
    var acts = getActions(u);
    acts[stepId] = !acts[stepId];
    saveActions(u, acts);
    refreshUI(u);
  };

  window.__pacToggleResult = function(stepId) {
    var session = getSession(); var u = session ? session.u : null; if (!u) return;
    var ress = getResults(u);
    ress[stepId] = !ress[stepId];
    saveResults(u, ress);
    refreshUI(u);
  };

  // ── REFRESH UI ───────────────────────────────────────────────────────────
  function refreshUI(u) {
    var prog  = getProgress(u);
    var acts  = getActions(u);
    var ress  = getResults(u);
    var done  = getDone(u);
    var pct   = getPct(u);
    var pts   = getTotalPoints(u);
    var pctOfMax = MAX_PTS > 0 ? Math.round(pts / MAX_PTS * 100) : 0;

    // Strip — row 1
    var bar = document.getElementById('pacPsBar');
    if (bar) bar.style.width = pct + '%';
    var countEl = document.getElementById('pacPsCount');
    if (countEl) countEl.textContent = done + '/' + STEPS.length;
    var ptsEl = document.getElementById('pacPsPts');
    if (ptsEl) ptsEl.textContent = fmtPts(pts);

    // Strip — row 2 cohort
    var cohortEl = document.getElementById('pacPsCohort');
    if (cohortEl) cohortEl.innerHTML = buildCohortHtml(u);

    // Modal hero
    var pmPts  = document.getElementById('pacPmPts');
    var pmBar  = document.getElementById('pacPmBar');
    var pmDone = document.getElementById('pacPmDone');
    if (pmPts)  pmPts.textContent  = pts;
    if (pmBar)  pmBar.style.width  = pctOfMax + '%';
    if (pmDone) pmDone.textContent = done;
    updateRank(u);

    // Modal steps — re-render each step row
    STEPS.forEach(function(s) {
      var el = document.getElementById('pacStep-' + s.id);
      if (!el) return;
      var isAction = !!acts[s.id];
      var isDone   = !!prog[s.id];
      var isResult = !!ress[s.id];
      var stepPts  = (isAction?s.pts.action:0) + (isDone?s.pts.done:0) + (isResult?s.pts.result:0);

      el.className = 'pac-pm-step' + (isDone?' has-done':'');

      var badges = el.querySelectorAll('.pac-badge');
      if (badges[0]) badges[0].className = 'pac-badge pac-badge-action'  + (isAction?' active':'');
      if (badges[1]) badges[1].className = 'pac-badge pac-badge-done'    + (isDone?  ' active':'');
      if (badges[2]) badges[2].className = 'pac-badge pac-badge-result'  + (isResult?' active':'');

      var ptsEl = document.getElementById('pacStepPts-' + s.id);
      if (ptsEl) {
        ptsEl.textContent = stepPts ? stepPts + ' pts' : '—';
        ptsEl.className   = 'pac-pm-step-pts' + (stepPts?'':' zero');
      }
    });
  }

  // ── MODAL OPEN/CLOSE ─────────────────────────────────────────────────────
  window.__pacOpenModal = function() {
    var m = document.getElementById('pacProgressModal');
    if (m) m.classList.add('open');
  };
  window.__pacCloseModal = function() {
    var m = document.getElementById('pacProgressModal');
    if (m) m.classList.remove('open');
  };

  // ── SUGGESTION ACTIONS ───────────────────────────────────────────────────
  window.__pacSugYes = function(stepId) {
    var session = getSession(); var u = session ? session.u : null; if (!u) return;
    var prog = getProgress(u); prog[stepId] = true; saveProgress(u, prog);
    refreshUI(u);
    var box = document.getElementById('pacSuggestion');
    if (box) {
      box.innerHTML = '<div class="pac-suggestion-icon">🎉</div><div class="pac-suggestion-body"><div class="pac-suggestion-q" style="color:#065f46;">Awesome — marked as done! Keep going.</div></div>';
      setTimeout(function(){ if(box.parentNode) box.remove(); }, 2500);
    }
  };
  window.__pacSugNo = function() {
    var box = document.getElementById('pacSuggestion');
    if (box) {
      box.innerHTML = '<div class="pac-suggestion-icon">💪</div><div class="pac-suggestion-body"><div class="pac-suggestion-q" style="color:#1e3a5f;">No worries — come back and tick it off when done!</div></div>';
      setTimeout(function(){ if(box.parentNode) box.remove(); }, 2500);
    }
    localStorage.setItem('pac-sug-dismiss-' + currentPage(), '1');
  };
  window.__pacSugDismiss = function() {
    var box = document.getElementById('pacSuggestion');
    if (box) box.remove();
    localStorage.setItem('pac-sug-dismiss-' + currentPage(), '1');
  };

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    var session = getSession();
    if (!session || !session.u) return;
    renderStrip(session);
    renderModal(session);
    renderSuggestion(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
