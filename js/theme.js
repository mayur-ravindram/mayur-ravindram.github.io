(function () {
  const storageKey = 'mayur-portfolio-theme';
  let theme;
  try { theme = localStorage.getItem(storageKey); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const applyTheme = (nextTheme) => {
    theme = nextTheme;
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
      const icon = button.querySelector('.theme-icon');
      const label = button.querySelector('.theme-label');
      if (icon) icon.textContent = dark ? '☀' : '☾';
      if (label) label.textContent = dark ? 'Light' : 'Dark';
    });
  };

  applyTheme(theme);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try { localStorage.setItem(storageKey, nextTheme); } catch (_) {}
    });
  });
})();
