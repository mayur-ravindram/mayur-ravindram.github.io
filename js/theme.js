(function () {
  const storageKey = 'mayur-portfolio-theme';
  let theme;
  try { theme = localStorage.getItem(storageKey); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const sunIconSVG = `
    <svg class="theme-svg theme-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sun-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="55%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
        <linearGradient id="sun-ray-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#EA580C"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5" fill="url(#sun-core-grad)"/>
      <g stroke="url(#sun-ray-grad)" stroke-width="2.1" stroke-linecap="round">
        <line x1="12" y1="1.75" x2="12" y2="4.25"/>
        <line x1="12" y1="19.75" x2="12" y2="22.25"/>
        <line x1="4.75" y1="4.75" x2="6.52" y2="6.52"/>
        <line x1="17.48" y1="17.48" x2="19.25" y2="19.25"/>
        <line x1="1.75" y1="12" x2="4.25" y2="12"/>
        <line x1="19.75" y1="12" x2="22.25" y2="12"/>
        <line x1="4.75" y1="19.25" x2="6.52" y2="17.48"/>
        <line x1="17.48" y1="6.52" x2="19.25" y2="4.75"/>
      </g>
    </svg>
  `;

  const moonIconSVG = `
    <svg class="theme-svg theme-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="moon-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#93C5FD"/>
          <stop offset="45%" stop-color="#818CF8"/>
          <stop offset="100%" stop-color="#C084FC"/>
        </linearGradient>
        <linearGradient id="moon-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#BFDBFE"/>
          <stop offset="100%" stop-color="#A855F7"/>
        </linearGradient>
      </defs>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="url(#moon-body-grad)" stroke="url(#moon-rim-grad)" stroke-width="0.8"/>
      <circle cx="18" cy="4.2" r="1.1" fill="#FDE047"/>
      <circle cx="19.8" cy="8.2" r="0.75" fill="#FDE047" opacity="0.85"/>
      <circle cx="15.8" cy="6.2" r="0.55" fill="#FFFFFF" opacity="0.9"/>
    </svg>
  `;

  const applyTheme = (nextTheme) => {
    theme = nextTheme;
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
      button.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      
      const icon = button.querySelector('.theme-icon');
      const label = button.querySelector('.theme-label');
      
      if (icon) {
        icon.innerHTML = isDark ? sunIconSVG : moonIconSVG;
      }
      if (label) {
        label.textContent = isDark ? 'Light' : 'Dark';
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('themetoggle', { detail: { theme } }));
    } catch (_) {}
  };

  applyTheme(theme);

  const initToggles = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      if (button.__themeBound) return;
      button.__themeBound = true;
      button.addEventListener('click', () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        try { localStorage.setItem(storageKey, nextTheme); } catch (_) {}
      });
    });
  };

  initToggles();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(theme);
    initToggles();
  });
})();
