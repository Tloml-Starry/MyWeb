(function () {
  try {
    const KEY = 'theme';
    const body = document.body;
    const stored = localStorage.getItem(KEY);
    if (stored === 'light') {
      body.classList.add('light-theme');
    }
    function setTheme(next) {
      const isLight = next === 'light';
      body.classList.toggle('light-theme', isLight);
      localStorage.setItem(KEY, isLight ? 'light' : 'dark');
    }
    function attachToggle(selector) {
      const el = document.querySelector(selector);
      if (!el) return;
      el.addEventListener('click', function () {
        const isLight = !body.classList.contains('light-theme');
        setTheme(isLight ? 'light' : 'dark');
      });
    }
    // Expose minimal API
    window.SiteTheme = {
      set: setTheme,
      initToggle: attachToggle
    };
    
    // 创建右侧悬浮返回主页按钮（小而不侵入）
    (function createFloatingHome() {
      try {
        if (document.getElementById('floating-home')) return;
        var a = document.createElement('a');
        a.id = 'floating-home';
        a.setAttribute('aria-label', '返回首页');
        a.title = '返回首页';
        // 计算合适的首页链接：优先使用 /MyWeb/index.html（GitHub Pages），否则回退到相对路径
        var repoRoot = '/MyWeb';
        var homeHref = '/index.html';
        if (location.pathname.indexOf(repoRoot + '/') === 0 || location.pathname === repoRoot || location.pathname.indexOf('/' + repoRoot + '/') >= 0) {
          homeHref = repoRoot + '/index.html';
        } else if (location.pathname.indexOf(repoRoot) !== -1) {
          homeHref = repoRoot + '/index.html';
        } else {
          // 计算相对回退路径（如果不是在服务器环境）
          var parts = location.pathname.split('/').filter(Boolean);
          // 如果路径以 index.html 结尾，去掉最后一段
          if (parts.length && parts[parts.length - 1].indexOf('.') !== -1) parts.pop();
          var up = '';
          for (var i = 0; i < parts.length; i++) { up += (i === 0 ? '' : '../'); }
          homeHref = (up ? up + 'index.html' : './index.html');
        }
        a.href = homeHref;

        // 内容与样式
        a.innerHTML = '<span style="display:inline-block;line-height:1;color:var(--on-surface,#fff);">首页</span>';
        a.style.position = 'fixed';
        a.style.right = '16px';
        a.style.bottom = '16px';
        a.style.zIndex = '100000';
        a.style.background = 'rgba(0,0,0,0.6)';
        a.style.color = '#fff';
        a.style.padding = '8px 10px';
        a.style.borderRadius = '10px';
        a.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
        a.style.textDecoration = 'none';
        a.style.fontSize = '14px';
        a.style.backdropFilter = 'blur(6px)';
        a.style.transition = 'transform 0.12s ease, opacity 0.12s ease';
        a.onmouseover = function () { a.style.transform = 'translateY(-3px)'; a.style.opacity = '0.95'; };
        a.onmouseout = function () { a.style.transform = 'none'; a.style.opacity = '1'; };

        // 兼容深色/浅色，尽量不破坏页面主题
        var prefersLight = document.body && document.body.classList && document.body.classList.contains('light-theme');
        if (prefersLight) {
          a.style.background = 'rgba(255,255,255,0.9)';
          a.style.color = '#111';
        }

        document.addEventListener('DOMContentLoaded', function () {
          document.body.appendChild(a);
        });
      } catch (e) {
        // ignore
      }
    })();
  } catch (e) {
    // no-op
  }
})();


