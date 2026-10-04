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
})();
