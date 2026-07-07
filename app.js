/* LLMPORT demo · 轻量登录态 + 创作/开发者模式(演示用) */
(function () {
  var AKEY = 'llmport_auth', MKEY = 'llmport_mode', mem = {};
  function g(k){ try { return localStorage.getItem(k); } catch(e){ return mem[k] || null; } }
  function set(k,v){ try { localStorage.setItem(k,v); } catch(e){ mem[k]=v; } }
  function del(k){ try { localStorage.removeItem(k); } catch(e){ delete mem[k]; } }

  var API = {
    isAuthed: function(){ return g(AKEY) === '1'; },
    mode: function(){ return g(MKEY) || 'creative'; },     // 默认创作
    login: function(mode){ set(AKEY,'1'); set(MKEY, mode || 'creative'); },
    enableDev: function(){ set(MKEY,'api'); },
    logout: function(){ del(AKEY); del(MKEY); }
  };
  window.LLMPORT = API;

  // 按模式显示/隐藏侧栏 Developers 分组(创作模式默认收起)
  function applyMode(){
    var isApi = API.mode() === 'api';
    var sel = 'aside.sidebar a.nav[href="api-platform.html"],aside.sidebar a.nav[href="api.html"],aside.sidebar a.nav[href="docs.html"]';
    document.querySelectorAll(sel).forEach(function(el){ el.style.display = isApi ? '' : 'none'; });
    document.querySelectorAll('aside.sidebar .sgroup').forEach(function(gp){
      if (gp.textContent.trim() === 'Developers') {
        gp.style.display = isApi ? '' : 'none';
        var prev = gp.previousElementSibling;
        if (prev && prev.classList && prev.classList.contains('sdiv')) prev.style.display = isApi ? '' : 'none';
      }
    });
  }

  function apply(){
    var authed = API.isAuthed();
    if (document.body.hasAttribute('data-protected') && !authed) { location.replace('login.html'); return; }
    document.querySelectorAll('[data-auth="guest"]').forEach(function(el){ el.style.display = authed ? 'none' : ''; });
    document.querySelectorAll('[data-auth="user"]').forEach(function(el){ el.style.display = authed ? '' : 'none'; });

    document.querySelectorAll('[data-action="login"]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); API.login('creative'); location.href = 'account.html'; });
    });
    document.querySelectorAll('[data-action="login-api"]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); API.login('api'); location.href = 'api.html'; });
    });
    document.querySelectorAll('[data-action="enable-dev"]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); API.enableDev(); location.href = 'api.html'; });
    });
    document.querySelectorAll('[data-action="logout"]').forEach(function(el){
      el.addEventListener('click', function(e){ e.preventDefault(); API.logout(); location.href = 'index.html'; });
    });

    applyMode();
  }
  if (document.readyState !== 'loading') apply();
  else document.addEventListener('DOMContentLoaded', apply);
})();
