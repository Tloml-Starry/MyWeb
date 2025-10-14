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
  } catch (e) {
    // no-op
  }
})();


