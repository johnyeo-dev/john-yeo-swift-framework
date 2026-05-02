// ── PAC SWIFT PROGRESS TRACKER ──────────────────────────────────────────────
// Self-injecting progress strip, modal, social proof, and page suggestions
(function() {
  'use strict';

  // ── STEPS ────────────────────────────────────────────────────────────────
  var STEPS = [
    { id:'sig',   label:'Signature',       short:'S',    color:'#0ABFBC', cat:'SWIFT', page:'signature-programme.html',    desc:'Created your Signature Programme' },
    { id:'web',   label:'Webinar',         short:'W',    color:'#4A8FE7', cat:'SWIFT', page:'webinar-programme.html',       desc:'Run your first Webinar' },
    { id:'inv',   label:'Invite',          short:'I',    color:'#8B5CF6', cat:'SWIFT', page:'invite-programme.html',        desc:'Set up your Invite / Referral system' },
    { id:'fill',  label:'Fill Class',      short:'F',    color:'#F59E0B', cat:'SWIFT', page:'fill-programme.html',          desc:'Used the Revenue Calculator' },
    { id:'track', label:'Track',           short:'T',    color:'#10B981', cat:'SWIFT', page:'track-programme.html',         desc:'Set up your tracking system' },
    { id:'p1',    label:'Prompt 1',        short:'✦1',   color:'#0ABFBC', cat:'AI',    page:'prompt-1-signature.html',      desc:'Run Prompt 1 · Signature' },
    { id:'p2',    label:'Prompt 2',        short:'✦2',   color:'#4A8FE7', cat:'AI',    page:'prompt-2-lead-magnet.html',    desc:'Run Prompt 2 · Lead Magnet' },
    { id:'p3',    label:'Prompt 3',        short:'✦3',   color:'#8B5CF6', cat:'AI',    page:'prompt-3-teach-to-pitch.html', desc:'Run Prompt 3 · Teach to Pitch' },
    { id:'p4',    label:'Prompt 4',        short:'✦4',   color:'#F59E0B', cat:'AI',    page:'prompt-3-content.html',        desc:'Run Prompt 4 · Content Style' },
    { id:'p5',    label:'Prompt 5',        short:'✦5',   color:'#10B981', cat:'AI',    page:'prompt-4-5-forms.html',        desc:'Run Prompt 5 · Lead Collection Form' },
    { id:'p6',    label:'Prompt 6',        short:'✦6',   color:'#EC4899', cat:'AI',    page:'prompt-6-feedback.html',       desc:'Run Prompt 6 · Feedback Form' },
  ];

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
  function getSession() { try { return JSON.parse(localStorage.getItem('pac-swift-session')||'null'); } catch(e){return null;} }
  function getUsers()   { try { return JSON.parse(localStorage.getItem('pac-swift-users')||'{}'); } catch(e){return {};} }

  function getProgress(u) {
    try { return JSON.parse(localStorage.getItem('pac-swift-progress-'+(u||'guest'))||'{}'); } catch(e){return{};}
  }
  function saveProgress(u, p) {
    localStorage.setItem('pac-swift-progress-'+(u||'guest'), JSON.stringify(p));
  }

  function getDone(u) {
    var p = getProgress(u);
    return STEPS.filter(function(s){ return p[s.id]; }).length;
  }

  function getPct(u) {
    return Math.round(getDone(u) / STEPS.length * 100);
  }

  function getAvatarColor(name) {
    var colors = ['#0ABFBC','#4A8FE7','#8B5CF6','#F59E0B','#10B981','#EC4899','#6366F1'];
    var h = 0;
    for (var i=0;i<name.length;i++) h = name.charCodeAt(i)+((h<<5)-h);
    return colors[Math.abs(h)%colors.length];
  }

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  // ── CSS ──────────────────────────────────────────────────────────────────
  var CSS = `
    .pac-ps { background:linear-gradient(90deg,#0d1520,#111827); border-bottom:2px solid rgba(10,191,188,0.25); padding:0 20px; display:flex; align-items:center; gap:12px; position:sticky; top:44px; z-index:89; height:46px; overflow:hidden; flex-shrink:0; }
    .pac-ps-label { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.4); white-space:nowrap; flex-shrink:0; }
    .pac-ps-bar-wrap { flex:0 0 120px; height:6px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden; flex-shrink:0; }
    .pac-ps-bar { height:100%; border-radius:99px; background:linear-gradient(90deg,#0ABFBC,#4A8FE7); transition:width 0.6s ease; }
    .pac-ps-pct { font-size:12px; font-weight:700; color:#0ABFBC; white-space:nowrap; flex-shrink:0; }
    .pac-ps-steps { display:flex; gap:4px; flex:1; overflow:hidden; }
    .pac-ps-step { width:26px; height:26px; border-radius:6px; border:1.5px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.15s; flex-shrink:0; position:relative; font-family:'DM Sans',sans-serif; }
    .pac-ps-step.done { color:white; border-color:transparent; }
    .pac-ps-step.done::after { content:'✓'; position:absolute; top:-4px; right:-4px; width:12px; height:12px; border-radius:50%; background:#10B981; font-size:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:900; }
    .pac-ps-step.current { box-shadow:0 0 0 2px rgba(10,191,188,0.6); }
    .pac-ps-step:hover { transform:scale(1.15); z-index:2; }
    .pac-ps-social { display:flex; align-items:center; gap:4px; margin-left:4px; flex-shrink:0; }
    .pac-ps-social-label { font-size:10px; color:rgba(255,255,255,0.3); white-space:nowrap; }
    .pac-ps-avatar { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:white; border:1.5px solid #111827; margin-left:-6px; cursor:pointer; position:relative; flex-shrink:0; }
    .pac-ps-avatar:first-child { margin-left:0; }
    .pac-ps-avatar-tip { display:none; position:absolute; bottom:calc(100%+6px); left:50%; transform:translateX(-50%); background:#111827; border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:6px 10px; white-space:nowrap; font-size:11px; color:white; z-index:200; }
    .pac-ps-avatar:hover .pac-ps-avatar-tip { display:block; }
    .pac-ps-btn { background:rgba(10,191,188,0.15); border:1px solid rgba(10,191,188,0.35); color:#0ABFBC; border-radius:7px; padding:5px 12px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:all 0.15s; }
    .pac-ps-btn:hover { background:rgba(10,191,188,0.25); }
    @media(max-width:768px) { .pac-ps { top:0; gap:8px; padding:0 12px; } .pac-ps-steps { display:none; } .pac-ps-social { display:none; } .pac-ps-bar-wrap { flex:1; } }

    /* PROGRESS MODAL */
    .pac-pm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:900; display:none; align-items:flex-start; justify-content:center; padding:20px; overflow-y:auto; }
    .pac-pm-overlay.open { display:flex; }
    .pac-pm { background:#fff; border-radius:20px; width:100%; max-width:580px; overflow:hidden; box-shadow:0 32px 80px rgba(0,0,0,0.3); margin:auto; }
    .pac-pm-head { background:linear-gradient(135deg,#0A0F1C,#111827); padding:24px 28px; display:flex; align-items:center; justify-content:space-between; }
    .pac-pm-head h2 { font-family:'DM Serif Display',serif; font-size:22px; color:white; }
    .pac-pm-head p { font-size:13px; color:rgba(255,255,255,0.5); margin-top:3px; }
    .pac-pm-close { background:none; border:none; color:rgba(255,255,255,0.5); font-size:22px; cursor:pointer; }
    .pac-pm-hero { padding:20px 28px; background:linear-gradient(135deg,rgba(10,191,188,0.06),rgba(74,143,231,0.06)); border-bottom:1px solid #E8EDF5; display:flex; align-items:center; gap:20px; }
    .pac-pm-big-pct { font-family:'DM Serif Display',serif; font-size:52px; color:#0ABFBC; line-height:1; }
    .pac-pm-hero-bar-wrap { flex:1; }
    .pac-pm-hero-bar-track { height:10px; background:#E8EDF5; border-radius:99px; overflow:hidden; margin-bottom:8px; }
    .pac-pm-hero-bar { height:100%; background:linear-gradient(90deg,#0ABFBC,#4A8FE7); border-radius:99px; transition:width 0.8s ease; }
    .pac-pm-hero-sub { font-size:13px; color:#6B7A96; }
    .pac-pm-hero-sub strong { color:#002D6A; }
    .pac-pm-body { padding:20px 28px 28px; }
    .pac-pm-cat { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6B7A96; margin:16px 0 10px; }
    .pac-pm-cat:first-child { margin-top:0; }
    .pac-pm-steps { display:flex; flex-direction:column; gap:8px; }
    .pac-pm-step { display:flex; align-items:center; gap:14px; padding:12px 14px; border-radius:10px; border:1.5px solid #E8EDF5; cursor:pointer; transition:all 0.15s; background:#F4F7FB; }
    .pac-pm-step:hover { background:#EEF3F9; }
    .pac-pm-step.done { background:rgba(16,185,129,0.06); border-color:rgba(16,185,129,0.3); }
    .pac-pm-step-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:white; flex-shrink:0; }
    .pac-pm-step-text { flex:1; }
    .pac-pm-step-label { font-size:14px; font-weight:600; color:#002D6A; }
    .pac-pm-step-desc  { font-size:12px; color:#6B7A96; margin-top:2px; }
    .pac-pm-step-check { width:24px; height:24px; border-radius:50%; border:2px solid #B8C4D4; display:flex; align-items:center; justify-content:center; font-size:13px; color:transparent; flex-shrink:0; transition:all 0.2s; }
    .pac-pm-step.done .pac-pm-step-check { background:#10B981; border-color:#10B981; color:white; }

    /* SOCIAL PROOF PANEL in modal */
    .pac-pm-social { background:#F4F7FB; border-top:1px solid #E8EDF5; padding:18px 28px; }
    .pac-pm-social h3 { font-size:13px; font-weight:700; color:#002D6A; margin-bottom:12px; }
    .pac-pm-member-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #E8EDF5; }
    .pac-pm-member-row:last-child { border-bottom:none; }
    .pac-pm-member-av { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:white; flex-shrink:0; }
    .pac-pm-member-name { flex:0 0 80px; font-size:13px; font-weight:600; color:#002D6A; }
    .pac-pm-member-bar-wrap { flex:1; height:6px; background:#E8EDF5; border-radius:99px; overflow:hidden; }
    .pac-pm-member-bar { height:100%; border-radius:99px; }
    .pac-pm-member-pct { font-size:12px; font-weight:700; color:#6B7A96; flex:0 0 36px; text-align:right; }

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

  // ── RENDER PROGRESS STRIP ────────────────────────────────────────────────
  function renderStrip(session) {
    var u = session ? session.u : null;
    if (!u) return;
    var prog = getProgress(u);
    var done = getDone(u);
    var pct  = getPct(u);
    var page = currentPage();

    // Build step pills
    var stepsHtml = STEPS.map(function(s) {
      var isDone    = !!prog[s.id];
      var isCurrent = (s.page === page);
      var cls = 'pac-ps-step' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '');
      return '<div class="' + cls + '" style="background:' + (isDone ? s.color : 'transparent') + '" '
           + 'onclick="window.__pacToggleStep(\'' + s.id + '\')" title="' + s.desc + '">' + s.short + '</div>';
    }).join('');

    // Social proof avatars
    var users = getUsers();
    var others = Object.keys(users).filter(function(ou){ return ou !== u; });
    if (u !== 'johnyeo') others = ['johnyeo'].concat(others);
    else others = Object.keys(users);
    others = others.slice(0, 5);
    var socialHtml = '';
    if (others.length) {
      socialHtml = '<div class="pac-ps-social">'
        + '<span class="pac-ps-social-label">also:</span>';
      others.forEach(function(ou) {
        var opct = getPct(ou);
        var color = getAvatarColor(ou);
        socialHtml += '<div class="pac-ps-avatar" style="background:' + color + ';">'
          + ou.charAt(0).toUpperCase()
          + '<div class="pac-ps-avatar-tip">' + ou + ' · ' + opct + '% done</div>'
          + '</div>';
      });
      socialHtml += '</div>';
    }

    var strip = document.createElement('div');
    strip.className = 'pac-ps';
    strip.id = 'pacProgressStrip';
    strip.innerHTML =
      '<span class="pac-ps-label">Progress</span>'
      + '<div class="pac-ps-bar-wrap"><div class="pac-ps-bar" id="pacPsBar" style="width:' + pct + '%"></div></div>'
      + '<span class="pac-ps-pct" id="pacPsPct">' + done + '/' + STEPS.length + '</span>'
      + '<div class="pac-ps-steps" id="pacPsSteps">' + stepsHtml + '</div>'
      + socialHtml
      + '<button class="pac-ps-btn" onclick="window.__pacOpenModal()">Details →</button>';

    // Insert after mobile-menu-bar or after swift-nav — before main content
    var insertAfter = document.querySelector('.mobile-menu-bar') || document.querySelector('.swift-nav');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(strip, insertAfter.nextSibling);
    }
  }

  // ── RENDER MODAL ─────────────────────────────────────────────────────────
  function renderModal(session) {
    var u = session ? session.u : null;
    if (!u) return;
    var prog = getProgress(u);
    var done = getDone(u);
    var pct  = getPct(u);

    // Group steps by category
    var swiftSteps = STEPS.filter(function(s){ return s.cat==='SWIFT'; });
    var aiSteps    = STEPS.filter(function(s){ return s.cat==='AI'; });

    function buildStepHtml(s) {
      var isDone = !!prog[s.id];
      return '<div class="pac-pm-step' + (isDone?' done':'') + '" onclick="window.__pacToggleStep(\'' + s.id + '\')">'
        + '<div class="pac-pm-step-icon" style="background:' + s.color + ';">' + s.short + '</div>'
        + '<div class="pac-pm-step-text"><div class="pac-pm-step-label">' + s.label + '</div><div class="pac-pm-step-desc">' + s.desc + '</div></div>'
        + '<div class="pac-pm-step-check">✓</div>'
        + '</div>';
    }

    // Social proof
    var users = getUsers();
    var allMembers = Object.keys(users);
    if (allMembers.indexOf('johnyeo') === -1) allMembers.unshift('johnyeo');
    allMembers = allMembers.filter(function(ou){ return ou !== u; }).slice(0, 6);

    var socialHtml = '';
    if (allMembers.length) {
      socialHtml = '<div class="pac-pm-social"><h3>👥 Your Cohort\'s Progress</h3>'
        + allMembers.map(function(ou) {
            var opct = getPct(ou);
            var color = getAvatarColor(ou);
            return '<div class="pac-pm-member-row">'
              + '<div class="pac-pm-member-av" style="background:' + color + ';">' + ou.charAt(0).toUpperCase() + '</div>'
              + '<div class="pac-pm-member-name">' + ou + '</div>'
              + '<div class="pac-pm-member-bar-wrap"><div class="pac-pm-member-bar" style="width:' + opct + '%;background:' + color + ';"></div></div>'
              + '<div class="pac-pm-member-pct">' + opct + '%</div>'
              + '</div>';
          }).join('')
        + '</div>';
    }

    var modal = document.createElement('div');
    modal.className = 'pac-pm-overlay';
    modal.id = 'pacProgressModal';
    modal.innerHTML =
      '<div class="pac-pm">'
      + '<div class="pac-pm-head"><div><h2>My Progress</h2><p>Track your SWIFT Framework journey</p></div><button class="pac-pm-close" onclick="window.__pacCloseModal()">✕</button></div>'
      + '<div class="pac-pm-hero">'
      + '<div class="pac-pm-big-pct" id="pacPmPct">' + pct + '%</div>'
      + '<div class="pac-pm-hero-bar-wrap">'
      + '<div class="pac-pm-hero-bar-track"><div class="pac-pm-hero-bar" id="pacPmBar" style="width:' + pct + '%"></div></div>'
      + '<div class="pac-pm-hero-sub"><strong id="pacPmDone">' + done + '</strong> of ' + STEPS.length + ' steps completed</div>'
      + '</div></div>'
      + '<div class="pac-pm-body">'
      + '<div class="pac-pm-cat">SWIFT Framework</div><div class="pac-pm-steps" id="pacPmSwiftSteps">' + swiftSteps.map(buildStepHtml).join('') + '</div>'
      + '<div class="pac-pm-cat">6 AI Prompts</div><div class="pac-pm-steps" id="pacPmAiSteps">' + aiSteps.map(buildStepHtml).join('') + '</div>'
      + '</div>'
      + socialHtml
      + '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) window.__pacCloseModal(); });
  }

  // ── SUGGESTION BOX ───────────────────────────────────────────────────────
  function renderSuggestion(session) {
    var u = session ? session.u : null;
    var page = currentPage();
    var sug = SUGGESTIONS[page];
    if (!sug) return;

    var prog = getProgress(u);
    // If already marked done, no suggestion
    if (prog[sug.stepId]) return;

    // Check if dismissed for this page
    var dismissKey = 'pac-sug-dismiss-' + page;
    if (localStorage.getItem(dismissKey)) return;

    var color = STEPS.find(function(s){ return s.id===sug.stepId; });
    var iconColor = color ? color.color : '#0ABFBC';

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

    // Insert at top of main content area
    var main = document.querySelector('.main') || document.querySelector('main') || document.querySelector('.page-content');
    if (main) {
      main.insertBefore(box, main.firstChild);
    }
  }

  // ── TOGGLE STEP ──────────────────────────────────────────────────────────
  window.__pacToggleStep = function(stepId) {
    var session = getSession();
    var u = session ? session.u : null;
    if (!u) return;
    var prog = getProgress(u);
    prog[stepId] = !prog[stepId];
    saveProgress(u, prog);
    refreshUI(u);
    // If toggled on from suggestion, hide suggestion box
    if (prog[stepId]) {
      var box = document.getElementById('pacSuggestion');
      if (box) box.remove();
    }
  };

  // ── REFRESH UI ───────────────────────────────────────────────────────────
  function refreshUI(u) {
    var prog = getProgress(u);
    var done = getDone(u);
    var pct  = getPct(u);
    var page = currentPage();

    // Update strip
    var bar = document.getElementById('pacPsBar');
    if (bar) bar.style.width = pct + '%';
    var pctEl = document.getElementById('pacPsPct');
    if (pctEl) pctEl.textContent = done + '/' + STEPS.length;
    var stepsEl = document.getElementById('pacPsSteps');
    if (stepsEl) {
      STEPS.forEach(function(s, i) {
        var el = stepsEl.children[i];
        if (!el) return;
        var isDone = !!prog[s.id];
        var isCurrent = (s.page === page);
        el.className = 'pac-ps-step' + (isDone?' done':'') + (isCurrent?' current':'');
        el.style.background = isDone ? s.color : 'transparent';
      });
    }

    // Update modal if open
    var pmBar  = document.getElementById('pacPmBar');
    var pmPct  = document.getElementById('pacPmPct');
    var pmDone = document.getElementById('pacPmDone');
    if (pmBar)  pmBar.style.width = pct + '%';
    if (pmPct)  pmPct.textContent  = pct + '%';
    if (pmDone) pmDone.textContent = done;

    var updateStepEls = function(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      container.querySelectorAll('.pac-pm-step').forEach(function(el) {
        var sid = el.getAttribute('onclick').match(/'([^']+)'/)[1];
        el.classList.toggle('done', !!prog[sid]);
      });
    };
    updateStepEls('pacPmSwiftSteps');
    updateStepEls('pacPmAiSteps');
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
    var session = getSession();
    var u = session ? session.u : null;
    if (!u) return;
    var prog = getProgress(u);
    prog[stepId] = true;
    saveProgress(u, prog);
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
      box.innerHTML = '<div class="pac-suggestion-icon">💪</div><div class="pac-suggestion-body"><div class="pac-suggestion-q" style="color:#1e3a5f;">No worries — you\'ve got this. Come back and tick it off when done!</div></div>';
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
    if (!session || !session.u) return; // not logged in — skip
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
