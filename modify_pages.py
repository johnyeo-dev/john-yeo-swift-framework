#!/usr/bin/env python3
"""Bulk-modify all 14 HTML pages to add auth guard, user pill, user manager modal, and print feature."""

import os
import re

BASE_DIR = '/Users/johnyeo/claude code/mkdir pac-swift && cd pac-swift'

PAGES = [
    'index.html',
    'signature-programme.html',
    'webinar-programme.html',
    'invite-programme.html',
    'fill-programme.html',
    'track-programme.html',
    'casestudies.html',
    'casestudy-feon.html',
    'casestudy-fion.html',
    'planner.html',
    'other-resources.html',
    'holiday-workshops.html',
    'payment-upgrade.html',
    'ig-ads.html',
]

AUTH_GUARD = '''<script>
(function(){
  try{var s=JSON.parse(localStorage.getItem('pac-swift-session'));if(!s||!s.u)window.location.replace('login.html');}catch(e){window.location.replace('login.html');}
})();
</script>'''

USER_PILL_HTML = '''<div class="user-pill" id="userPill" onclick="toggleUserMenu()">
      <span class="user-avatar" id="userAvatar">J</span>
      <span class="user-name" id="userNameDisplay">...</span>
      <div class="user-menu" id="userMenu">
        <div class="user-menu-name" id="userMenuName">johnyeo</div>
        <button class="user-menu-item" onclick="openUserManager()">Manage Users</button>
        <button class="user-menu-item logout" onclick="doLogout()">Log out</button>
      </div>
    </div>'''

USER_PILL_CSS = '''
    /* USER PILL */
    .user-pill { position: relative; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 99px; padding: 6px 12px 6px 6px; cursor: pointer; flex-shrink: 0; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--gold); color: var(--navy); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'DM Sans', sans-serif; }
    .user-name { font-size: 13px; color: white; font-weight: 500; }
    .user-menu { display: none; position: absolute; top: calc(100% + 8px); right: 0; background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; min-width: 160px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 300; }
    .user-menu.open { display: block; }
    .user-menu-name { padding: 12px 16px; font-size: 12px; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .user-menu-item { display: block; width: 100%; padding: 11px 16px; background: none; border: none; color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
    .user-menu-item:hover { background: rgba(255,255,255,0.06); color: white; }
    .user-menu-item.logout { color: #f87171; }
    .user-menu-item.logout:hover { background: rgba(248,113,113,0.1); }'''

USER_MANAGER_MODAL_HTML = '''
  <!-- USER MANAGER MODAL -->
  <div id="userManagerModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:500; align-items:center; justify-content:center;">
    <div style="background:white; border-radius:16px; width:min(480px,92vw); max-height:80vh; overflow:hidden; display:flex; flex-direction:column;">
      <div style="background:#002D6A; padding:20px 24px; display:flex; align-items:center; justify-content:space-between;">
        <h3 style="font-family:'DM Serif Display',serif; color:white; font-size:20px;">Manage Users</h3>
        <button onclick="document.getElementById('userManagerModal').style.display='none'" style="background:rgba(255,255,255,0.1);border:none;color:white;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;">&#215;</button>
      </div>
      <div style="padding:24px; overflow-y:auto; flex:1;">
        <div id="userList" style="margin-bottom:24px;"></div>
        <div style="border-top:1px solid #E8EDF5; padding-top:20px;">
          <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B7A96;margin-bottom:12px;">Add New User</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input id="newUsername" placeholder="Username" style="flex:1;min-width:100px;border:1.5px solid #B8C4D4;border-radius:8px;padding:9px 12px;font-family:'DM Sans',sans-serif;font-size:13px;">
            <input id="newPassword" placeholder="Password" type="text" style="flex:1;min-width:100px;border:1.5px solid #B8C4D4;border-radius:8px;padding:9px 12px;font-family:'DM Sans',sans-serif;font-size:13px;">
            <button onclick="addUser()" style="background:#002D6A;color:white;border:none;border-radius:8px;padding:9px 16px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;cursor:pointer;">Add</button>
          </div>
          <p id="addUserMsg" style="font-size:12px;margin-top:8px;color:#0ABFBC;display:none;"></p>
        </div>
      </div>
    </div>
  </div>'''

AUTH_JS_BLOCK = '''  <script>
    /* AUTH / USER PILL JS */
    function getSession() { try { return JSON.parse(localStorage.getItem('pac-swift-session')); } catch(e) { return null; } }
    function doLogout() { localStorage.removeItem('pac-swift-session'); window.location.href = 'login.html'; }
    function toggleUserMenu() { document.getElementById('userMenu').classList.toggle('open'); }
    document.addEventListener('click', function(e) {
      var pill = document.getElementById('userPill');
      if (pill && !pill.contains(e.target)) document.getElementById('userMenu').classList.remove('open');
    });
    function openUserManager() {
      document.getElementById('userManagerModal').style.display = 'flex';
      renderUserList();
      document.getElementById('userMenu').classList.remove('open');
    }
    (function initUser() {
      var s = getSession();
      if (!s) return;
      document.getElementById('userNameDisplay').textContent = s.u;
      document.getElementById('userAvatar').textContent = s.u.charAt(0).toUpperCase();
      document.getElementById('userMenuName').textContent = s.u;
      if (s.role !== 'admin') {
        var manageBtn = document.querySelector('.user-menu-item[onclick="openUserManager()"]');
        if (manageBtn) manageBtn.style.display = 'none';
      }
    })();

    /* USER MANAGER JS */
    function getUsers() { try { return JSON.parse(localStorage.getItem('pac-swift-users') || '{}'); } catch(e) { return {}; } }
    function saveUsers(u) { localStorage.setItem('pac-swift-users', JSON.stringify(u)); }
    function renderUserList() {
      var users = getUsers();
      var keys = Object.keys(users);
      var el = document.getElementById('userList');
      if (!el) return;
      if (!keys.length) { el.innerHTML = '<p style="font-size:13px;color:#6B7A96;">No users yet. Add one below.</p>'; return; }
      el.innerHTML = '<p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B7A96;margin-bottom:10px;">Current Users</p>' +
        keys.map(function(k) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#F4F7FB;border-radius:8px;margin-bottom:6px;">' +
            '<span style="font-size:13px;font-weight:600;color:#0A0F1C;">' + k + '</span>' +
            '<button onclick="removeUser(\\'' + k + '\\')" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;font-weight:600;">Remove</button>' +
            '</div>';
        }).join('');
    }
    function addUser() {
      var u = document.getElementById('newUsername').value.trim();
      var p = document.getElementById('newPassword').value.trim();
      var msg = document.getElementById('addUserMsg');
      if (!u || !p) { msg.textContent = 'Please fill in both fields.'; msg.style.color='#ef4444'; msg.style.display='block'; return; }
      if (u === 'johnyeo') { msg.textContent = 'Cannot overwrite master account.'; msg.style.color='#ef4444'; msg.style.display='block'; return; }
      var users = getUsers(); users[u] = { password: p, role: 'user' }; saveUsers(users);
      document.getElementById('newUsername').value = ''; document.getElementById('newPassword').value = '';
      msg.textContent = 'User "' + u + '" added!'; msg.style.color='#0ABFBC'; msg.style.display='block';
      setTimeout(function(){ msg.style.display='none'; }, 3000);
      renderUserList();
    }
    function removeUser(u) {
      if (!confirm('Remove user "' + u + '"?')) return;
      var users = getUsers(); delete users[u]; saveUsers(users); renderUserList();
    }
  </script>'''

PRINT_CSS = '''
    /* PRINT / PDF */
    .btn-print { background: var(--navy); color: white; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; }
    .btn-print:hover { background: #001a40; }
    @media print {
      .swift-nav, .swift-nav-mobile, .header, .panel-overlay, .edit-panel, .planner-top, .legend, .plan-progress, .user-pill, #userManagerModal { display: none !important; }
      body { background: white !important; }
      .main { padding: 8px !important; max-width: 100% !important; margin: 0 !important; }
      .cal-wrap { border-radius: 0 !important; }
      .cal-cell { min-height: 80px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .day-pill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 landscape; margin: 10mm; }
    }'''

PRINT_JS_BLOCK = '''  <script>
    function printCalendar() {
      if (!planData.startDate) { alert('Please set a start date first.'); return; }
      window.print();
    }
  </script>'''

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def add_auth_guard(html):
    """Insert auth guard as its own <script> block right after viewport meta tag."""
    pattern = r'(<meta\s+name=["\']viewport["\'][^>]*>)'
    replacement = r'\1\n  ' + AUTH_GUARD
    result = re.sub(pattern, replacement, html, count=1)
    if result == html:
        # Fallback: after charset meta
        pattern2 = r'(<meta\s+charset=[^>]+>)'
        result = re.sub(pattern2, r'\1\n  ' + AUTH_GUARD, html, count=1)
    return result

def add_user_pill(html):
    """Insert user pill before the .swift-badge div inside header."""
    pattern = r'(<header[^>]*class="header"[^>]*>[\s\S]*?)(\s*<div class="swift-badge">)'
    def replacer(m):
        return m.group(1) + '\n    ' + USER_PILL_HTML + m.group(2)
    result = re.sub(pattern, replacer, html, count=1)
    return result

def add_user_pill_css(html):
    """Add user pill CSS before closing </style> tag (first style block)."""
    result = html.replace('</style>', USER_PILL_CSS + '\n  </style>', 1)
    return result

def add_user_manager_modal(html):
    """Insert user manager modal before </body>."""
    result = html.replace('</body>', USER_MANAGER_MODAL_HTML + '\n\n</body>', 1)
    return result

def add_auth_js_block(html):
    """Add auth JS as a separate <script> block before </body>."""
    result = html.replace('</body>', AUTH_JS_BLOCK + '\n\n</body>', 1)
    return result

def add_print_button(html):
    """Add print button next to Reset Plan button in planner.html."""
    pattern = r'(<button class="btn-reset"[^>]*>Reset Plan</button>)'
    replacement = r'\1\n        <button class="btn-print" onclick="printCalendar()">&#128424;&#65039; Print / Save PDF</button>'
    result = re.sub(pattern, replacement, html, count=1)
    return result

def add_print_css(html):
    """Add print CSS to planner.html (before closing </style>)."""
    result = html.replace('</style>', PRINT_CSS + '\n  </style>', 1)
    return result

def add_print_js_block(html):
    """Add print JS as a separate <script> block before </body>."""
    result = html.replace('</body>', PRINT_JS_BLOCK + '\n\n</body>', 1)
    return result

def process_page(filename):
    path = os.path.join(BASE_DIR, filename)
    html = read_file(path)

    # 1. Auth guard (standalone script block in <head>)
    html = add_auth_guard(html)

    # 2. User pill HTML (inside header, before .swift-badge)
    html = add_user_pill(html)

    # 3. User pill CSS (into first <style> block)
    html = add_user_pill_css(html)

    # 4. User manager modal HTML (before </body>)
    html = add_user_manager_modal(html)

    # 5. Auth JS block (separate <script> before </body>)
    html = add_auth_js_block(html)

    # 6. Planner-specific: print button + print CSS + print JS
    if filename == 'planner.html':
        html = add_print_button(html)
        html = add_print_css(html)
        html = add_print_js_block(html)

    write_file(path, html)
    print(f'  OK: {filename}')

if __name__ == '__main__':
    print(f'Processing {len(PAGES)} pages...')
    errors = []
    for page in PAGES:
        try:
            process_page(page)
        except Exception as e:
            print(f'  FAIL: {page}: {e}')
            errors.append((page, e))
    if errors:
        print(f'\n{len(errors)} errors occurred.')
    else:
        print(f'\nAll {len(PAGES)} pages processed successfully.')
