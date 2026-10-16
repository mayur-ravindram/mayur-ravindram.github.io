/**
 * Mayur Ravindra Portfolio - Zero-Dependency Analytics & Telemetry Engine
 * Tracks visitor metrics, hardware specs, network telemetry, engagement, and performance
 * completely client-side without any external tracking libraries or third-party cookies.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'mr_portfolio_analytics_v1';
  const SESSION_KEY = 'mr_portfolio_session_v1';

  // Helper to safely access localStorage
  const getStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  };

  const setStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper to safely access sessionStorage
  const getSession = () => {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  };

  const setSession = (data) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      return true;
    } catch (_) {
      return false;
    }
  };

  // Default analytics schema
  const createDefaultAnalytics = () => {
    const now = new Date().toISOString();
    return {
      summary: {
        totalVisits: 0,
        uniqueSessions: 0,
        firstSeen: now,
        lastSeen: now,
        totalDurationSeconds: 0,
        totalClicks: 0,
        themeToggles: 0,
        resumeViews: 0,
        emailClicks: 0,
        labDrawersOpened: 0
      },
      dailyVisits: {},      // 'YYYY-MM-DD': count
      pageViews: {},        // path: count
      devices: {
        Desktop: 0,
        Mobile: 0,
        Tablet: 0
      },
      browsers: {},         // Chrome, Safari, Firefox, Edge, etc.
      operatingSystems: {}, // Windows, macOS, iOS, Android, Linux, etc.
      referrers: {},        // Direct, GitHub, LinkedIn, Google, etc.
      screenResolutions: {},// '1920x1080': count
      languages: {},        // 'en-US': count
      timezones: {},        // 'Asia/Kolkata': count
      sectionsViewed: {     // '#work': count, etc.
        '#top': 0,
        '#thinking': 0,
        '#work': 0,
        '#lab': 0,
        '#about': 0,
        '#contact': 0
      },
      drawersOpened: {},    // 'kinship': count, etc.
      themePreferences: {
        dark: 0,
        light: 0
      },
      scrollDepthMilestones: {
        '25%': 0,
        '50%': 0,
        '75%': 0,
        '100%': 0
      },
      performanceAverages: {
        count: 0,
        totalLoadTime: 0,
        totalDOMContentLoaded: 0,
        totalTTFB: 0
      },
      systemCapabilities: {
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth || 24,
        colorSchemePreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light',
        reducedMotionPreference: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced' : 'Normal',
        cpuCores: navigator.hardwareConcurrency || 'N/A',
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A',
        touchSupport: (navigator.maxTouchPoints > 0) ? `Yes (${navigator.maxTouchPoints} pts)` : 'No',
        connectionType: (navigator.connection && navigator.connection.effectiveType) ? navigator.connection.effectiveType.toUpperCase() : 'N/A',
        downlinkSpeed: (navigator.connection && navigator.connection.downlink) ? `${navigator.connection.downlink} Mbps` : 'N/A',
        rttLatency: (navigator.connection && navigator.connection.rtt) ? `${navigator.connection.rtt} ms` : 'N/A',
        language: navigator.language || 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      recentSessions: []    // Last 30 sessions
    };
  };

  // Device classification
  const detectDevice = () => {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const hasTouch = navigator.maxTouchPoints > 0;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (hasTouch && width >= 681 && width <= 1024)) {
      return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua) || (hasTouch && width <= 680)) {
      return 'Mobile';
    }
    return 'Desktop';
  };

  // Browser detection
  const detectBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    if (ua.includes('MSIE ') || ua.includes('Trident/')) return 'Internet Explorer';
    return 'Other';
  };

  // OS detection
  const detectOS = () => {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/CrOS/i.test(ua)) return 'ChromeOS';
    return 'Other';
  };

  // Referrer categorization
  const detectReferrer = () => {
    const ref = document.referrer;
    if (!ref) return 'Direct';
    try {
      const url = new URL(ref);
      const host = url.hostname.toLowerCase();
      if (host === window.location.hostname) return 'Internal';
      if (host.includes('github.com')) return 'GitHub';
      if (host.includes('linkedin.com')) return 'LinkedIn';
      if (host.includes('google.')) return 'Google Search';
      if (host.includes('bing.com')) return 'Bing Search';
      if (host.includes('duckduckgo.com')) return 'DuckDuckGo';
      if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) return 'Twitter / X';
      if (host.includes('reddit.com')) return 'Reddit';
      if (host.includes('youtube.com')) return 'YouTube';
      return host.replace(/^www\./, '');
    } catch (_) {
      return 'Referral';
    }
  };

  // Initialize or load analytics dataset
  let analyticsData = getStorage();
  if (!analyticsData) {
    analyticsData = createDefaultAnalytics();
  }

  // Session tracking
  let currentSession = getSession();
  const isNewSession = !currentSession;
  const nowISO = new Date().toISOString();
  const todayKey = nowISO.split('T')[0];

  if (isNewSession) {
    currentSession = {
      id: 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
      startTime: Date.now(),
      startTimeISO: nowISO,
      lastActive: Date.now(),
      durationSeconds: 0,
      entryPage: window.location.pathname || '/',
      referrer: detectReferrer(),
      device: detectDevice(),
      browser: detectBrowser(),
      os: detectOS(),
      screen: `${window.screen.width}x${window.screen.height}`,
      maxScrollDepth: 0,
      actionsCount: 0,
      pagesVisited: [window.location.pathname || '/']
    };
    analyticsData.summary.uniqueSessions = (analyticsData.summary.uniqueSessions || 0) + 1;
  } else {
    currentSession.lastActive = Date.now();
    if (!currentSession.pagesVisited.includes(window.location.pathname || '/')) {
      currentSession.pagesVisited.push(window.location.pathname || '/');
    }
  }

  // Record this visit
  analyticsData.summary.totalVisits = (analyticsData.summary.totalVisits || 0) + 1;
  analyticsData.summary.lastSeen = nowISO;

  // Daily visits
  analyticsData.dailyVisits[todayKey] = (analyticsData.dailyVisits[todayKey] || 0) + 1;

  // Page views
  const currentPath = window.location.pathname || '/';
  analyticsData.pageViews[currentPath] = (analyticsData.pageViews[currentPath] || 0) + 1;

  // Devices, Browsers, OS
  const deviceType = detectDevice();
  analyticsData.devices[deviceType] = (analyticsData.devices[deviceType] || 0) + 1;

  const browserName = detectBrowser();
  analyticsData.browsers[browserName] = (analyticsData.browsers[browserName] || 0) + 1;

  const osName = detectOS();
  analyticsData.operatingSystems[osName] = (analyticsData.operatingSystems[osName] || 0) + 1;

  // Referrer
  const referrerCat = detectReferrer();
  if (referrerCat !== 'Internal') {
    analyticsData.referrers[referrerCat] = (analyticsData.referrers[referrerCat] || 0) + 1;
  }

  // Screen resolution
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  analyticsData.screenResolutions[screenRes] = (analyticsData.screenResolutions[screenRes] || 0) + 1;

  // Language & Timezone
  const lang = navigator.language || 'en';
  analyticsData.languages[lang] = (analyticsData.languages[lang] || 0) + 1;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  analyticsData.timezones[tz] = (analyticsData.timezones[tz] || 0) + 1;

  // Active theme tracking
  const currentTheme = document.documentElement.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (analyticsData.themePreferences[currentTheme] !== undefined) {
    analyticsData.themePreferences[currentTheme] = (analyticsData.themePreferences[currentTheme] || 0) + 1;
  }

  // Update live system capabilities snapshot
  analyticsData.systemCapabilities = {
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth || 24,
    colorSchemePreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light',
    reducedMotionPreference: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced' : 'Normal',
    cpuCores: navigator.hardwareConcurrency || 'N/A',
    deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A',
    touchSupport: (navigator.maxTouchPoints > 0) ? `Yes (${navigator.maxTouchPoints} pts)` : 'No',
    connectionType: (navigator.connection && navigator.connection.effectiveType) ? navigator.connection.effectiveType.toUpperCase() : 'N/A',
    downlinkSpeed: (navigator.connection && navigator.connection.downlink) ? `${navigator.connection.downlink} Mbps` : 'N/A',
    rttLatency: (navigator.connection && navigator.connection.rtt) ? `${navigator.connection.rtt} ms` : 'N/A',
    language: navigator.language || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };

  // Save session and updated analytics
  setSession(currentSession);
  setStorage(analyticsData);

  // Performance telemetry (Navigation Timing API)
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries && perfEntries.length > 0) {
          const entry = perfEntries[0];
          const loadTime = Math.max(0, Math.round(entry.loadEventEnd - entry.startTime));
          const domReady = Math.max(0, Math.round(entry.domContentLoadedEventEnd - entry.startTime));
          const ttfb = Math.max(0, Math.round(entry.responseStart - entry.requestStart));

          if (loadTime > 0) {
            const currentData = getStorage() || analyticsData;
            const perf = currentData.performanceAverages || { count: 0, totalLoadTime: 0, totalDOMContentLoaded: 0, totalTTFB: 0 };
            perf.count += 1;
            perf.totalLoadTime += loadTime;
            perf.totalDOMContentLoaded += domReady;
            perf.totalTTFB += ttfb;
            currentData.performanceAverages = perf;

            if (currentSession) {
              currentSession.performance = { loadTime, domReady, ttfb };
              setSession(currentSession);
            }
            setStorage(currentData);
          }
        }
      } catch (_) {}
    }, 1500);
  });

  // Track scroll depth milestones
  const trackedMilestones = { '25%': false, '50%': false, '75%': false, '100%': false };
  const checkScrollDepth = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrollPercent = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));

    if (currentSession && scrollPercent > currentSession.maxScrollDepth) {
      currentSession.maxScrollDepth = scrollPercent;
      setSession(currentSession);
    }

    const check = (pct, label) => {
      if (scrollPercent >= pct && !trackedMilestones[label]) {
        trackedMilestones[label] = true;
        const currentData = getStorage() || analyticsData;
        if (!currentData.scrollDepthMilestones) currentData.scrollDepthMilestones = {};
        currentData.scrollDepthMilestones[label] = (currentData.scrollDepthMilestones[label] || 0) + 1;
        setStorage(currentData);
      }
    };

    check(25, '25%');
    check(50, '50%');
    check(75, '75%');
    check(95, '100%');
  };

  window.addEventListener('scroll', checkScrollDepth, { passive: true });

  // Track session active duration
  let sessionTimer = null;
  const updateDuration = () => {
    if (!document.hidden && currentSession) {
      const now = Date.now();
      const elapsed = Math.round((now - currentSession.startTime) / 1000);
      currentSession.durationSeconds = elapsed;
      currentSession.lastActive = now;
      setSession(currentSession);

      const currentData = getStorage();
      if (currentData) {
        currentData.summary.totalDurationSeconds = (currentData.summary.totalDurationSeconds || 0) + 5;
        // Sync recent session in storage
        const existingIdx = (currentData.recentSessions || []).findIndex(s => s.id === currentSession.id);
        const sessionRecord = {
          id: currentSession.id,
          startTime: currentSession.startTimeISO,
          duration: currentSession.durationSeconds,
          entryPage: currentSession.entryPage,
          referrer: currentSession.referrer,
          device: currentSession.device,
          browser: currentSession.browser,
          os: currentSession.os,
          maxScroll: currentSession.maxScrollDepth || 0,
          actions: currentSession.actionsCount || 0
        };
        if (existingIdx >= 0) {
          currentData.recentSessions[existingIdx] = sessionRecord;
        } else {
          currentData.recentSessions = [sessionRecord, ...(currentData.recentSessions || [])].slice(0, 30);
        }
        setStorage(currentData);
      }
    }
  };
  sessionTimer = setInterval(updateDuration, 5000);

  // Sync on visibility change or tab close
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      updateDuration();
    }
  });
  window.addEventListener('pagehide', updateDuration);

  // Track interactions & user behavior
  document.addEventListener('click', (event) => {
    const target = event.target.closest('a, button, [data-track]');
    if (!target) return;

    const currentData = getStorage() || analyticsData;
    currentData.summary.totalClicks = (currentData.summary.totalClicks || 0) + 1;
    if (currentSession) {
      currentSession.actionsCount = (currentSession.actionsCount || 0) + 1;
      setSession(currentSession);
    }

    // Theme toggle
    if (target.matches('[data-theme-toggle]') || target.closest('[data-theme-toggle]')) {
      currentData.summary.themeToggles = (currentData.summary.themeToggles || 0) + 1;
      const nextTheme = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
      if (!currentData.themePreferences) currentData.themePreferences = { dark: 0, light: 0 };
      currentData.themePreferences[nextTheme] = (currentData.themePreferences[nextTheme] || 0) + 1;
    }

    // Resume clicks
    if (target.matches('a[href*="resume"]') || target.innerText.toLowerCase().includes('résumé') || target.innerText.toLowerCase().includes('resume')) {
      currentData.summary.resumeViews = (currentData.summary.resumeViews || 0) + 1;
    }

    // Email clicks
    if (target.matches('a[href^="mailto:"]')) {
      currentData.summary.emailClicks = (currentData.summary.emailClicks || 0) + 1;
    }

    // Lab card clicks
    const labCard = target.closest('.lab-card');
    if (labCard) {
      const labHref = labCard.getAttribute('href');
      currentData.summary.labDrawersOpened = (currentData.summary.labDrawersOpened || 0) + 1;
      if (labHref && labHref.startsWith('#')) {
        const drawerId = labHref.replace('#', '');
        if (!currentData.drawersOpened) currentData.drawersOpened = {};
        currentData.drawersOpened[drawerId] = (currentData.drawersOpened[drawerId] || 0) + 1;
      }
    }

    setStorage(currentData);
  });

  // Track sections viewed via IntersectionObserver
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          const id = '#' + entry.target.id;
          const currentData = getStorage() || analyticsData;
          if (!currentData.sectionsViewed) currentData.sectionsViewed = {};
          currentData.sectionsViewed[id] = (currentData.sectionsViewed[id] || 0) + 1;
          setStorage(currentData);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // Keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A navigates to hidden analytics page
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'A' || event.key === 'a')) {
      event.preventDefault();
      window.location.href = 'analytics.html';
    }
  });

  // Footer mini-insight click handler to view analytics
  document.addEventListener('DOMContentLoaded', () => {
    const miniInsight = document.getElementById('mini-insight');
    if (miniInsight) {
      miniInsight.style.cursor = 'pointer';
      miniInsight.setAttribute('title', 'Click to open private analytics dashboard (or press Ctrl+Shift+A)');
      miniInsight.addEventListener('click', (e) => {
        // If Shift is pressed or direct click
        if (e.shiftKey || e.detail >= 2) {
          window.location.href = 'analytics.html';
        }
      });
    }
  });

  // Global API exposed for hidden analytics page and developer tools
  window.MRAnalytics = {
    getData: () => getStorage() || createDefaultAnalytics(),
    getSession: () => getSession() || currentSession,
    setStorage,
    exportJSON: () => {
      const data = getStorage() || createDefaultAnalytics();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mr-portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    clearData: () => {
      const fresh = createDefaultAnalytics();
      setStorage(fresh);
      return fresh;
    },
    seedDemoData: () => {
      const sample = createDefaultAnalytics();
      sample.summary.totalVisits = 348;
      sample.summary.uniqueSessions = 184;
      sample.summary.totalClicks = 892;
      sample.summary.totalDurationSeconds = 184 * 85;
      sample.summary.themeToggles = 94;
      sample.summary.resumeViews = 62;
      sample.summary.emailClicks = 19;
      sample.summary.labDrawersOpened = 87;

      // Generate 14 days of realistic daily visits
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().split('T')[0];
        sample.dailyVisits[k] = Math.floor(12 + Math.random() * 28 + (13 - i));
      }

      sample.pageViews = {
        '/': 240,
        '/resume.html': 78,
        '/analytics.html': 30
      };

      sample.devices = {
        Desktop: 226,
        Mobile: 104,
        Tablet: 18
      };

      sample.browsers = {
        Chrome: 198,
        Safari: 82,
        Firefox: 42,
        Edge: 22,
        Other: 4
      };

      sample.operatingSystems = {
        macOS: 142,
        Windows: 110,
        iOS: 54,
        Android: 28,
        Linux: 14
      };

      sample.referrers = {
        Direct: 134,
        GitHub: 88,
        LinkedIn: 72,
        'Google Search': 34,
        'Twitter / X': 20
      };

      sample.sectionsViewed = {
        '#top': 348,
        '#thinking': 210,
        '#work': 295,
        '#lab': 245,
        '#about': 180,
        '#contact': 155
      };

      sample.drawersOpened = {
        'kinship': 45,
        'eggspress': 22,
        'bank': 18,
        'wifi-chat': 15,
        'two-d-planner': 12
      };

      sample.themePreferences = {
        dark: 215,
        light: 133
      };

      sample.scrollDepthMilestones = {
        '25%': 310,
        '50%': 264,
        '75%': 198,
        '100%': 142
      };

      sample.performanceAverages = {
        count: 140,
        totalLoadTime: 140 * 420,
        totalDOMContentLoaded: 140 * 180,
        totalTTFB: 140 * 65
      };

      // Populate realistic sessions
      const sampleReferrers = ['GitHub', 'LinkedIn', 'Direct', 'Google Search', 'Twitter / X'];
      const sampleDevices = ['Desktop', 'Desktop', 'Mobile', 'Desktop', 'Tablet'];
      const sampleBrowsers = ['Chrome', 'Safari', 'Firefox', 'Chrome', 'Edge'];
      const sampleOS = ['macOS', 'Windows', 'iOS', 'Linux', 'macOS'];

      sample.recentSessions = [];
      for (let s = 1; s <= 20; s++) {
        const sDate = new Date(today);
        sDate.setMinutes(sDate.getMinutes() - s * 45);
        sample.recentSessions.push({
          id: 'sess_' + sDate.getTime().toString(36),
          startTime: sDate.toISOString(),
          duration: Math.floor(30 + Math.random() * 220),
          entryPage: s % 4 === 0 ? '/resume.html' : '/',
          referrer: sampleReferrers[s % sampleReferrers.length],
          device: sampleDevices[s % sampleDevices.length],
          browser: sampleBrowsers[s % sampleBrowsers.length],
          os: sampleOS[s % sampleOS.length],
          maxScroll: Math.min(100, 45 + Math.floor(Math.random() * 55)),
          actions: Math.floor(3 + Math.random() * 12)
        });
      }

      setStorage(sample);
      return sample;
    }
  };

  // Discreet console note
  try {
    console.log(
      '%c[MR Telemetry]%c Zero-library analytics engine active. Press %cCtrl+Shift+A%c or visit %canalytics.html%c to inspect.',
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;',
      'background: #333; color: #fff; padding: 2px 4px; border-radius: 3px;',
      'color: inherit;',
      'text-decoration: underline; font-weight: bold;',
      'color: inherit;'
    );
  } catch (_) {}
})();
