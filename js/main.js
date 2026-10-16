(function () {
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  let scrollFrame = null;

  const cancelScroll = () => {
    if (scrollFrame !== null) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }
  };

  const scrollToTarget = (target) => {
    cancelScroll();

    const targetTop = Math.max(
      0,
      window.scrollY + target.getBoundingClientRect().top -
        parseFloat(getComputedStyle(target).scrollMarginTop || '0')
    );
    const startTop = window.scrollY;
    const distance = targetTop - startTop;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 1) {
      window.scrollTo({ top: targetTop, behavior: 'instant' });
      return;
    }

    const duration = Math.min(900, Math.max(350, Math.abs(distance) * 0.35));
    let startTime;
    const animate = (time) => {
      if (startTime === undefined) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      window.scrollTo({
        top: startTop + distance * progress,
        behavior: 'instant'
      });
      if (progress < 1) {
        scrollFrame = requestAnimationFrame(animate);
      } else {
        scrollFrame = null;
      }
    };

    scrollFrame = requestAnimationFrame(animate);
  };

  ['wheel', 'touchstart', 'pointerdown'].forEach(type => {
    window.addEventListener(type, cancelScroll, { passive: true });
  });

  const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 8);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    siteNav.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
        if (window.location.hash !== link.getAttribute('href')) {
          history.pushState(null, '', link.getAttribute('href'));
        }
      });
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const closeDrawer = (drawer) => {
    drawer.hidden = true;
    document.body.style.overflow = '';
  };
  const openDrawer = (drawer) => {
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  document.querySelectorAll('.lab-card').forEach(card => {
    const id = card.getAttribute('href');
    if (!id || !id.startsWith('#')) return;
    const drawer = document.querySelector(id);
    if (!drawer) return;
    card.addEventListener('click', (event) => {
      event.preventDefault();
      openDrawer(drawer);
    });
    drawer.querySelectorAll('[data-close], .drawer-close').forEach(control => {
      control.addEventListener('click', () => closeDrawer(drawer));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.project-drawer:not([hidden])').forEach(closeDrawer);
    }
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Mini insight: record and display page visitor count
  const initVisitorInsight = () => {
    const miniInsight = document.getElementById('mini-insight');
    const countEl = document.getElementById('visitor-count');
    if (!miniInsight || !countEl) return;

    const counterKey = 'mayur-ravindram-github-io-visitors';
    const sessionKey = 'mayur_site_session_counted';
    const cacheKey = 'mayur_site_cached_visitors';

    // Show cached count immediately to avoid layout delay
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && !isNaN(Number(cached))) {
        countEl.textContent = Number(cached).toLocaleString();
      }
    } catch (_) {}

    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
    const forceHit = new URLSearchParams(window.location.search).has('hit');

    let hasVisited = false;
    try {
      hasVisited = sessionStorage.getItem(sessionKey) === 'true';
    } catch (_) {}

    const shouldIncrement = forceHit || (!isLocal && !hasVisited);
    const endpoint = shouldIncrement
      ? `https://countapi.mileshilliard.com/api/v1/hit/${counterKey}`
      : `https://countapi.mileshilliard.com/api/v1/get/${counterKey}`;

    const updateDisplay = (value) => {
      const formatted = Number(value).toLocaleString();
      countEl.textContent = formatted;
      miniInsight.setAttribute('title', `Page visits recorded: ${formatted} • Click to refresh`);
      try {
        localStorage.setItem(cacheKey, String(value));
      } catch (_) {}
    };

    const fetchCount = (url, isHitRequest) => {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

      fetch(url, controller ? { signal: controller.signal } : undefined)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (typeof data.value === 'number') {
            updateDisplay(data.value);
            if (isHitRequest) {
              try {
                sessionStorage.setItem(sessionKey, 'true');
              } catch (_) {}
            }
          }
        })
        .catch(() => {
          if (timeoutId) clearTimeout(timeoutId);
          // Fallback to cache if still placeholder
          if (countEl.textContent === '—' || countEl.textContent === '') {
            try {
              const cached = localStorage.getItem(cacheKey);
              countEl.textContent = cached ? Number(cached).toLocaleString() : '1+';
            } catch (_) {
              countEl.textContent = '1+';
            }
          }
        });
    };

    fetchCount(endpoint, shouldIncrement);

    // Allow user to click the mini insight to refresh current count
    miniInsight.addEventListener('click', () => {
      countEl.style.opacity = '0.5';
      fetch(`https://countapi.mileshilliard.com/api/v1/get/${counterKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.value === 'number') updateDisplay(data.value);
        })
        .catch(() => {})
        .finally(() => {
          countEl.style.opacity = '1';
        });
    });
  };

  initVisitorInsight();
})();
