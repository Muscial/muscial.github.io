/* MAL shared utilities */
(function (global) {
  var STORE_KEY = 'mal-data-v1';
  var BOOT_KEY = 'mal-boot-seen';

  var S = {};

  S.loadData = function () {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(global.SEED_DATA));
  };

  S.saveData = function (data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  };

  S.resetData = function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  };

  S.getPostsIndex = function () {
    return (global.MAL_POSTS || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  };

  S.computeStats = function (data) {
    var anime = data.anime || [];
    var years = anime.map(function (a) { return a.watchedYear; }).filter(Boolean);
    var scores = anime.map(function (a) { return a.score; }).filter(function (s) { return s != null && s !== ''; });
    var minY = years.length ? Math.min.apply(null, years) : 0;
    var maxY = years.length ? Math.max.apply(null, years) : 0;
    var avg = scores.length ? (scores.reduce(function (x, y) { return x + y; }, 0) / scores.length) : 0;
    var posts = S.getPostsIndex().filter(function (p) { return p.published !== false; });
    return {
      total: anime.length,
      yearsSpan: maxY ? (maxY - minY + 1) : 0,
      averageScore: avg,
      latestYear: maxY,
      blogCount: posts.length
    };
  };

  S.settings = function (data) { return data.settings || {}; };

  S.serializeNumber = function (i) { return String(i + 1).padStart(3, '0'); };

  S.seasonOf = function (month) {
    if (month >= 1 && month <= 3) return 'WINTER';
    if (month <= 6) return 'SPRING';
    if (month <= 9) return 'SUMMER';
    return 'AUTUMN';
  };

  S.escapeHtml = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  S.avatarInitial = function (name) {
    var n = (name || '?').trim();
    return n.charAt(0).toUpperCase() || '?';
  };

  S.initBoot = function (opts) {
    var screen = document.querySelector('.boot-screen');
    if (!screen) return;
    var skip = screen.querySelector('.boot-skip');
    var done = false;
    var fast = false;
    try { fast = localStorage.getItem(BOOT_KEY) === '1'; } catch (e) { /* ignore */ }
    var delay = fast ? 600 : 1400;
    function hide() {
      if (done) return;
      done = true;
      screen.classList.add('done');
      try { localStorage.setItem(BOOT_KEY, '1'); } catch (e) { /* ignore */ }
      if (opts && opts.onDone) opts.onDone();
    }
    if (skip) skip.addEventListener('click', hide);
    setTimeout(hide, delay);
    window.addEventListener('load', function () { setTimeout(hide, 300); });
  };

  S.initReveal = function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  };

  S.initTopbar = function () {
    var nav = document.querySelector('.main-nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a[href^="#"]');
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) sections.push({ a: a, el: el });
    });
    window.addEventListener('scroll', function () {
      var y = window.scrollY + 120;
      var cur = null;
      sections.forEach(function (s) { if (s.el.offsetTop <= y) cur = s; });
      links.forEach(function (a) { a.classList.remove('active'); });
      if (cur) cur.a.classList.add('active');
    });
  };

  S.setupCoverFallbacks = function (root) {
    root = root || document;
    var imgs = root.querySelectorAll('img');
    imgs.forEach(function (img) {
      if (img.dataset.fbBound) return;
      img.dataset.fbBound = '1';
      img.addEventListener('error', function () { img.style.display = 'none'; });
      if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
    });
  };

  S.applyFooter = function (data) {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var st = S.settings(data);
    var yr = new Date().getFullYear();
    var views = 0;
    try {
      var vk = 'mal-page-views';
      var today = new Date().toDateString();
      var rec = JSON.parse(localStorage.getItem(vk) || '{"date":"","count":0}');
      if (rec.date !== today) { rec.date = today; rec.count += 1; }
      localStorage.setItem(vk, JSON.stringify(rec));
      views = rec.count;
    } catch (e) { /* ignore */ }
    el.innerHTML =
      '<div class="footer-inner">' +
        '<div class="footer-brand">' +
          '<span class="brand-mark">M</span>' +
          '<div><strong>' + S.escapeHtml(st.siteName || '') + '</strong>' +
          '<small>' + S.escapeHtml(st.footerSubtitle || st.siteSubtitle || '') + '</small></div>' +
        '</div>' +
        '<div class="footer-chips">' +
          '<span>' + S.escapeHtml(st.footerProjectLabel || 'PROJECT / 00') + '</span>' +
          '<span>' + S.escapeHtml(st.footerStorageLabel || 'STORAGE / LOCAL') + '</span>' +
          '<span>' + S.escapeHtml(st.footerStatusLabel || 'STATUS / NOMINAL') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<div>' + S.escapeHtml((st.footerCopyright || '').replace('{year}', yr)) +
          (st.icpRecordLabel ? ' <a href="' + S.escapeHtml(st.icpRecordUrl || '#') + '" rel="nofollow" target="_blank">' + S.escapeHtml(st.icpRecordLabel) + '</a>' : '') +
          (st.policeRecordLabel ? ' <a href="' + S.escapeHtml(st.policeRecordUrl || '#') + '" rel="nofollow" target="_blank">' + S.escapeHtml(st.policeRecordLabel) + '</a>' : '') +
        '</div>' +
        '<span class="footer-views"><i></i>' + S.escapeHtml(st.pageViewLabel || 'PAGE VIEWS') + ' ' + views + '</span>' +
      '</div>';
  };

  S.icon = function (name) {
    var icons = {
      shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
      down: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
      back: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
      db: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
      cal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
      wave: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
      book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
      term: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
      arrow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
      edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
      trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
      check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
      refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
      ext: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
      eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
      left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
      right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
    };
    return icons[name] || '';
  };

  global.MAL = S;
})(window);
