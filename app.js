/* LLMPORT demo · 轻量登录态 + 创作/开发者模式(演示用) */
(function () {
  var AKEY = 'llmport_auth', MKEY = 'llmport_mode', mem = {};
  function g(k){ try { return localStorage.getItem(k); } catch(e){ return mem[k] || null; } }
  function set(k,v){ try { localStorage.setItem(k,v); } catch(e){ mem[k]=v; } }
  function del(k){ try { localStorage.removeItem(k); } catch(e){ delete mem[k]; } }

  var HIS_KEYS = ['llmport_his_video','llmport_his_image'];
  function clearHistory(){ HIS_KEYS.forEach(function(k){ del(k); }); }

  var API = {
    isAuthed: function(){ return g(AKEY) === '1'; },
    mode: function(){ return g(MKEY) || 'creative'; },     // 默认创作
    // 登录:开启新的创作会话,清空上一次登录遗留的历史
    login: function(mode){ clearHistory(); set(AKEY,'1'); set(MKEY, mode || 'creative'); },
    enableDev: function(){ set(MKEY,'api'); },
    // 退出:清空登录态与本次创作历史(历史仅前端保存,不入库)
    logout: function(){ del(AKEY); del(MKEY); clearHistory(); }
  };
  window.LLMPORT = API;

  // 按模式显示/隐藏侧栏 Developers 分组(创作模式默认收起)
  function applyMode(){
    var isApi = API.mode() === 'api';
    var sel = 'aside.sidebar a.nav[href="api-platform.html"],aside.sidebar a.nav[href="api.html"],aside.sidebar a.nav[href="docs.html"]';
    document.querySelectorAll(sel).forEach(function(el){ el.style.display = isApi ? '' : 'none'; });
    // 开发者模式下才显示 API 积分卡；单池时不加"站内"限定词（无对比对象）
    document.querySelectorAll('[data-dev-only]').forEach(function(el){ el.style.display = isApi ? '' : 'none'; });
    document.querySelectorAll('[data-credit-label]').forEach(function(el){ el.textContent = isApi ? '站内积分（创作台）' : '积分余额'; });
    // 顶栏药丸：单池时不提"与 API 积分独立"（无对比对象）
    document.querySelectorAll('a.credits[title],span.credits[title]').forEach(function(el){
      if (el.title.indexOf('API 积分（开发者）') === 0) return;   // api.html 自己的 API 药丸，不动
      el.title = isApi ? '站内积分（创作台）· 与 API 积分独立' : '积分余额（创作台）';
    });
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
      el.addEventListener('click', function(e){
        e.preventDefault(); API.login('creative');
        var next = new URLSearchParams(location.search).get('next');
        location.href = next ? decodeURIComponent(next) : 'account.html';
      });
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
    applyBanner();
  }

  /* 顶部 Banner:可关闭,关闭后 7 天内不再显示 */
  function applyBanner(){
    var el=document.getElementById("topBanner"); if(!el) return;
    var BK='llmport_banner_dismissed';
    var until=parseInt(g(BK)||'0',10);
    if(until && Date.now() < until){ el.style.display='none'; return; }
    var btn=document.getElementById("tbClose");
    if(btn) btn.addEventListener("click",function(){
      el.style.display='none';
      set(BK, String(Date.now()+7*24*60*60*1000));
    });
  }
  if (document.readyState !== 'loading') apply();
  else document.addEventListener('DOMContentLoaded', apply);
})();
