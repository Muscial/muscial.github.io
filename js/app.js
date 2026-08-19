/* MAL homepage logic */
(function () {
  'use strict';
  var S = window.MAL;
  var data = S.loadData();
  var st = S.settings(data);

  /* ---------- i18n ---------- */
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (st[key]) el.textContent = st[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-html');
    if (st[key]) el.innerHTML = (key === 'adminEntryLabel' ? S.icon('shield') + ' ' : '') + st[key];
  });

  /* ---------- hero ---------- */
  var hp = document.querySelector('.hero-description');
  if (hp) hp.textContent = st.heroDescription || '';
  var heroLoc = document.querySelector('.hero-footnotes span:first-child');
  var heroMode = document.querySelector('.hero-footnotes span:nth-child(2)');
  if (heroLoc && st.heroLocation) heroLoc.textContent = st.heroLocation;
  if (heroMode && st.heroMode) heroMode.textContent = st.heroMode;
  document.getElementById('hero-update-year').textContent = (new Date().getFullYear());

  var avatar = document.getElementById('hero-avatar');
  if (avatar) {
    var prof = data.profile || {};
    var fallback = document.getElementById('hero-avatar-fallback');
    var fallbackChar = (prof.displayName || 'M').charAt(0).toUpperCase();
    if (fallback) fallback.textContent = fallbackChar;
    if (prof.avatar) {
      var im = new Image();
      im.onload = function () { avatar.innerHTML = ''; avatar.appendChild(im); };
      im.onerror = function () { if (fallback) fallback.style.display = 'grid'; };
      im.src = prof.avatar;
    } else if (fallback) {
      fallback.style.display = 'grid';
    }
  }

  /* ---------- stats ---------- */
  var stats = S.computeStats(data);
  var statDefs = [
    { k: '01/A', icon: 'db', value: stats.total, suffix: st.statTotalSuffix, label: st.statTotalLabel },
    { k: '01/B', icon: 'cal', value: stats.yearsSpan, suffix: st.statYearsSuffix, label: st.statYearsLabel },
    { k: '01/C', icon: 'wave', value: stats.averageScore.toFixed(1), suffix: st.statScoreSuffix, label: st.statScoreLabel },
    { k: '01/D', icon: 'book', value: stats.blogCount, suffix: st.statBlogSuffix, label: st.statBlogLabel }
  ];
  var statsGrid = document.getElementById('stats-grid');
  if (statsGrid) {
    statsGrid.innerHTML = statDefs.map(function (d) {
      return '<article class="stat-card"><span class="stat-index">' + d.k + '</span>' +
        '<span class="stat-icon">' + S.icon(d.icon) + '</span>' +
        '<div class="stat-value">' + d.value + '<small>' + d.suffix + '</small></div>' +
        '<p>' + d.label + '</p></article>';
    }).join('');
  }

  /* ---------- top 10 ---------- */
  var orbit = document.getElementById('priority-orbit');
  var topIds = data.top || [];
  var topAnime = topIds.map(function (id) {
    for (var i = 0; i < data.anime.length; i++) if (data.anime[i].id === id) return data.anime[i];
    return null;
  }).filter(Boolean);
  var selected = 0;

  function coverHtml(a, cls, fbCls) {
    return '<div class="' + (cls || '') + '"><img src="' + S.escapeHtml(a.imageUrl || '') + '" alt="" loading="lazy">' +
      '<span class="' + (fbCls || 'cover-fallback') + '" style="display:none">' + S.avatarInitial(a.titleCn) + '</span></div>';
  }

  function renderOrbit() {
    var mobile = window.innerWidth <= 900;
    if (mobile) {
      orbit.innerHTML = '<div class="orbit-slots-mobile">' + topAnime.map(function (a, i) {
        return '<button class="orbit-slot' + (i === selected ? ' is-selected' : '') + '" data-idx="' + i + '" aria-label="' + S.escapeHtml(a.titleCn) + '">' +
          coverHtml(a, 'orbit-cover') + '<span class="orbit-rank">0' + (i + 1) + '</span>' +
          '<span class="orbit-name">' + S.escapeHtml(a.titleCn) + '</span></button>';
      }).join('') + '</div>' + priorityCardHtml(topAnime[selected], selected) + '</div>';
    } else {
      var slots = topAnime.map(function (a, i) {
        var angle = (i / topAnime.length) * Math.PI * 2 - Math.PI / 2;
        var x = 50 + Math.cos(angle) * 38;
        var y = 50 + Math.sin(angle) * 36;
        return '<button class="orbit-slot' + (i === selected ? ' is-selected' : '') + '" data-idx="' + i + '"' +
          ' style="left:' + x + '%;top:' + y + '%;--slot-delay:' + (i * 24) + 'ms"' +
          ' aria-label="' + S.escapeHtml(a.titleCn) + '">' +
          coverHtml(a, 'orbit-cover') + '<span class="orbit-rank">0' + (i + 1) + '</span>' +
          '<span class="orbit-name">' + S.escapeHtml(a.titleCn) + '</span></button>';
      }).join('');
      orbit.innerHTML = '<div class="orbit-lines" aria-hidden="true"><i class="orbit-line orbit-line-a"></i><i class="orbit-line orbit-line-b"></i></div>' +
        slots + priorityCardHtml(topAnime[selected], selected);
    }
    orbit.querySelectorAll('.orbit-slot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = parseInt(btn.getAttribute('data-idx'), 10);
        renderOrbit();
      });
    });
    S.setupCoverFallbacks(orbit);
  }

  function priorityCardHtml(a, i) {
    var note = a.note || a.summary || '';
    return '<div class="priority-core"><article class="priority-card transition-fade">' +
      '<div class="priority-visual">' + (a.imageUrl ? '<img src="' + S.escapeHtml(a.imageUrl) + '" alt="' + S.escapeHtml(a.titleCn) + ' 封面" loading="lazy">' : '') +
      '<span class="cover-fallback" style="display:' + (a.imageUrl ? 'none' : 'grid') + '">' + S.avatarInitial(a.titleCn) + '</span>' +
      '<div class="priority-rank">0' + (i + 1) + '</div></div>' +
      '<div class="priority-copy">' +
      '<span class="priority-kicker">' + S.escapeHtml(st.topSelectedLabel || 'SELECTED / PERSONAL PRIORITY') + '</span>' +
      '<h3>' + S.escapeHtml(a.titleCn) + '</h3>' +
      (a.titleOriginal ? '<p class="priority-original">' + S.escapeHtml(a.titleOriginal) + '</p>' : '') +
      (note ? '<p class="priority-desc">' + S.escapeHtml(note) + '</p>' : '') +
      '<div class="priority-meta">' +
      '<span class="score">' + (a.score != null ? a.score : '—') + '</span>' +
      '<span>' + S.escapeHtml(a.watchedYear || '') + '</span>' +
      '<a class="priority-link" href="' + S.escapeHtml(a.bangumiUrl) + '" target="_blank" rel="noopener">' +
      S.escapeHtml(st.topOpenSubjectLabel || 'OPEN SUBJECT') + ' ' + S.icon('ext') + '</a>' +
      '</div></div></article></div>';
  }

  if (orbit && topAnime.length) renderOrbit();

  /* ---------- records: module switch ---------- */
  var tabDefs = [
    { id: 'anime', label: st.animeTabLabel || 'ANIME LIST', title: st.archiveTitle, desc: st.animeDescription },
    { id: 'watchlist', label: st.watchlistTabLabel || 'BACKLOG', title: st.watchlistTitle, desc: st.watchlistDescription },
    { id: 'blog', label: st.blogTabLabel || 'BLOG NOTES', title: st.blogTitle, desc: st.blogDescription }
  ];
  var tabBar = document.getElementById('records-tabs');
  var recordsTitle = document.getElementById('records-title');
  var recordsDesc = document.getElementById('records-desc');
  var currentTab = 'anime';

  function setTab(id) {
    currentTab = id;
    tabBar.querySelectorAll('button[data-tab]').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
      t.setAttribute('aria-selected', t.getAttribute('data-tab') === id ? 'true' : 'false');
    });
    ['anime', 'watchlist', 'blog'].forEach(function (p) {
      document.getElementById('panel-' + p).classList.toggle('active', p === id);
    });
    var def = tabDefs.filter(function (d) { return d.id === id; })[0];
    if (def) {
      recordsTitle.textContent = def.title;
      recordsDesc.textContent = def.desc || '';
    }
    if (id === 'anime') renderAnime();
    if (id === 'watchlist') renderWatchlist();
    if (id === 'blog') renderBlog();
    try {
      var rec = document.getElementById('records');
      if (rec) rec.setAttribute('data-active-tab', id);
      history.replaceState(null, '', '#records-' + id);
    } catch (e) { /* ignore */ }
  }

  /* nav deep links: ANIME / BACKLOG / BLOG -> switch module + scroll */
  document.querySelectorAll('.main-nav a[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () {
      setTab(a.getAttribute('data-tab'));
    });
  });

  if (tabBar) {
    tabBar.innerHTML = tabDefs.map(function (d, i) {
      return '<button role="tab" data-tab="' + d.id + '" class="' + (d.id === 'anime' ? 'is-active' : '') + '" aria-selected="' + (d.id === 'anime' ? 'true' : 'false') + '">' +
        '<span>0' + (i + 1) + '</span> ' + d.label + '</button>';
    }).join('') +
      '<div class="module-arrows">' +
      '<button id="tab-prev" aria-label="切换到上一模块">' + S.icon('left') + '</button>' +
      '<button id="tab-next" aria-label="切换到下一模块">' + S.icon('right') + '</button>' +
      '</div>';
    tabBar.querySelectorAll('button[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    });
    var idx = function () { return tabDefs.map(function (d) { return d.id; }).indexOf(currentTab); };
    document.getElementById('tab-prev').addEventListener('click', function () {
      setTab(tabDefs[(idx() - 1 + tabDefs.length) % tabDefs.length].id);
    });
    document.getElementById('tab-next').addEventListener('click', function () {
      setTab(tabDefs[(idx() + 1) % tabDefs.length].id);
    });
  }

  /* ---------- anime list ---------- */
  var searchEl = document.getElementById('anime-search');
  var years = [];
  data.anime.forEach(function (a) {
    if (a.watchedYear && years.indexOf(a.watchedYear) === -1) years.push(a.watchedYear);
  });
  years.sort(function (a, b) { return b - a; });
  var activeYear = 'ALL';

  var chipBar = document.getElementById('year-chips');
  if (chipBar) {
    chipBar.innerHTML = '<button class="is-active" data-year="ALL">' + S.escapeHtml(st.allYearsLabel || 'ALL') + '</button>' +
      years.map(function (y) { return '<button data-year="' + y + '">' + y + '</button>'; }).join('');
    chipBar.querySelectorAll('button').forEach(function (c) {
      c.addEventListener('click', function () {
        activeYear = c.getAttribute('data-year');
        chipBar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-active', x === c); });
        renderAnime();
      });
    });
  }

  var searchTerm = '';
  if (searchEl) {
    searchEl.placeholder = st.searchPlaceholder || 'SEARCH ARCHIVE / 搜索标题';
    var debounce = null;
    searchEl.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { searchTerm = searchEl.value.trim().toLowerCase(); renderAnime(); }, 160);
    });
  }

  function matchesAnime(a) {
    if (activeYear !== 'ALL' && a.watchedYear !== activeYear) return false;
    if (searchTerm) {
      var hay = (a.titleCn + ' ' + (a.titleOriginal || '') + ' ' + a.sortTitle).toLowerCase();
      if (hay.indexOf(searchTerm) === -1) return false;
    }
    return true;
  }

  function serial(i) {
    return (st.animeSerialPrefix || 'AAL-') + S.serializeNumber(i);
  }

  var STAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>';

  function renderAnime() {
    var container = document.getElementById('anime-timeline');
    var list = data.anime.filter(matchesAnime);
    var groups = {};
    list.forEach(function (a) {
      var y = a.watchedYear || 'N/A';
      (groups[y] = groups[y] || []).push(a);
    });
    var yearsSorted = Object.keys(groups).sort(function (a, b) { return b - a; });
    var serialIndex = {};
    data.anime.forEach(function (a, i) { serialIndex[a.id] = i; });
    if (!yearsSorted.length) {
      container.innerHTML = '<div class="no-results"><h4>' + S.escapeHtml(st.noResultsTitle || 'NO MATCHED RECORDS') + '</h4>' +
        '<p>' + S.escapeHtml(st.noResultsDescription || '') + '</p>' +
        '<button id="reset-filter">' + S.escapeHtml(st.resetFilterLabel || 'RESET FILTER') + '</button></div>';
      var reset = document.getElementById('reset-filter');
      if (reset) {
        reset.addEventListener('click', function () {
          searchEl.value = ''; searchTerm = '';
          activeYear = 'ALL';
          chipBar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-year') === 'ALL'); });
          renderAnime();
        });
      }
      return;
    }
    container.innerHTML = yearsSorted.map(function (y) {
      var items = groups[y];
      return '<section class="year-group">' +
        '<div class="year-rail"><span>' + S.escapeHtml(st.timelineYearLabel || 'TIMELINE YEAR') + '</span>' +
        '<h3>' + y + '</h3><p>' + String(items.length).padStart(2, '0') + ' ' + S.escapeHtml(st.timelineRecordsLabel || 'RECORDS') + '</p><i></i></div>' +
        '<div class="anime-grid">' + items.map(function (a) {
          var sn = serialIndex[a.id];
          return '<article class="anime-card" title="' + S.escapeHtml(a.titleCn) + (a.titleOriginal ? ' / ' + S.escapeHtml(a.titleOriginal) : '') + '">' +
            '<a class="anime-cover" href="' + S.escapeHtml(a.bangumiUrl) + '" target="_blank" rel="noopener" aria-label="' + S.escapeHtml(a.titleCn) + '，前往 Bangumi">' +
            (a.imageUrl ? '<img src="' + S.escapeHtml(a.imageUrl) + '" alt="' + S.escapeHtml(a.titleCn) + ' 封面" loading="lazy">' : '') +
            '<span class="cover-fallback" style="display:' + (a.imageUrl ? 'none' : 'grid') + '">' + S.avatarInitial(a.titleCn) + '</span>' +
            '<span class="anime-serial">' + serial(sn) + '</span>' +
            '<span class="anime-score">' + STAR_SVG + ' ' + (a.score != null ? a.score : '—') + '</span>' +
            '<span class="anime-card-copy"><small>' + y + '</small><strong>' + S.escapeHtml(a.titleCn) + '</strong></span>' +
            '</a></article>';
        }).join('') + '</div></section>';
    }).join('');
    S.setupCoverFallbacks(container);
  }

  /* ---------- watchlist ---------- */
  function renderWatchlist() {
    var container = document.getElementById('watchlist-timeline');
    var wl = (data.watchlist || []).slice().sort(function (a, b) {
      return (b.seasonYear - a.seasonYear) || (b.seasonMonth - a.seasonMonth);
    });
    var groups = {};
    wl.forEach(function (w) {
      var key = (w.seasonYear || 'N/A') + '-' + (w.seasonMonth || 0);
      (groups[key] = groups[key] || []).push(w);
    });
    var keys = Object.keys(groups).sort().reverse();
    if (!keys.length) {
      container.innerHTML = '<div class="no-results"><h4>' + S.escapeHtml(st.watchlistEmptyTitle || 'BACKLOG IS CLEAR') + '</h4>' +
        '<p>' + S.escapeHtml(st.watchlistEmptyDescription || '') + '</p></div>';
      return;
    }
    container.innerHTML = keys.map(function (key, gi) {
      var parts = key.split('-');
      var y = parts[0], m = parseInt(parts[1], 10);
      var season = S.seasonOf(m);
      var items = groups[key];
      return '<section class="watchlist-season">' +
        '<div class="watchlist-rail"><span>' + S.escapeHtml(st.watchlistTimelineLabel || 'AIRING SEASON') + '</span>' +
        '<h3>' + y + ' ' + season + '<br>' + S.escapeHtml(st.watchlistSeasonSuffix || 'SEASON') + '</h3>' +
        '<p>' + items.length + ' ' + S.escapeHtml(st.watchlistRecordsLabel || 'PENDING TITLES') + '</p><i></i></div>' +
        '<div class="watchlist-grid">' + items.map(function (w) {
          var exp = w.expectationScore != null ? w.expectationScore : 0;
          return '<div class="watchlist-card">' +
            '<a class="watchlist-cover" href="' + S.escapeHtml(w.bangumiUrl) + '" target="_blank" rel="noopener">' +
            (w.imageUrl ? '<img src="' + S.escapeHtml(w.imageUrl) + '" alt="' + S.escapeHtml(w.titleCn) + ' 封面" loading="lazy">' : '') +
            '<span class="cover-fallback" style="display:' + (w.imageUrl ? 'none' : 'grid') + '">' + S.avatarInitial(w.titleCn) + '</span>' +
            '<span class="watchlist-serial">MAL-W' + String(gi + 1).padStart(2, '0') + '</span>' +
            '<span class="expectation-score">' + exp.toFixed(1) + '</span>' +
            '</a>' +
            '<div class="watchlist-card-copy">' +
            '<div class="watchlist-expectation-core">' +
            '<b>' + exp.toFixed(1) + '</b>' +
            '<div class="exp-track"><i style="width:' + Math.max(2, exp * 10) + '%"></i></div>' +
            '<small>' + S.escapeHtml(st.expectationLabel || 'EXPECTATION') + S.escapeHtml(st.expectationSuffix || '/ 10') + '</small>' +
            '</div>' +
            '<div class="watch-title">' + S.escapeHtml(w.titleCn) + '</div>' +
            (w.titleOriginal ? '<div class="watch-original">' + S.escapeHtml(w.titleOriginal) + '</div>' : '') +
            (w.expectationNote ? '<div class="watch-note"><b>' + S.escapeHtml(st.watchlistNoteLabel || 'PERSONAL NOTE') + '</b>' + S.escapeHtml(w.expectationNote) + '</div>' : '') +
            '<div class="watch-meta">' +
            (w.airDate ? '<span>' + S.escapeHtml(st.watchlistAirDateLabel || 'AIR DATE') + ' ' + w.airDate + '</span>' : '') +
            '<span class="bgm-score">BGM ' + (w.bangumiScore != null ? w.bangumiScore : '—') + '</span>' +
            (w.bgmRank ? '<span>RANK #' + w.bgmRank + '</span>' : '') +
            '</div>' +
            '</div></div>';
        }).join('') + '</div></section>';
    }).join('');
    S.setupCoverFallbacks(container);
  }

  /* ---------- blog ---------- */
  function renderBlog() {
    var container = document.getElementById('blog-grid');
    var filePosts = S.getPostsIndex();
    var dbPosts = (data.blogs || []).map(function (b) {
      return {
        slug: b.slug, title: b.title, date: (b.publishedAt || b.date || '').slice(0, 10),
        category: b.category || '杂谈', published: b.published !== false,
        content: b.content, excerpt: b.excerpt || ''
      };
    });
    var posts = filePosts.concat(dbPosts).sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (!posts.length) {
      container.innerHTML = '<div class="no-results"><h4>' + S.escapeHtml(st.blogEmptyTitle || 'NO FIELD NOTES') + '</h4>' +
        '<p>' + S.escapeHtml(st.blogEmptyDescription || '') + '</p></div>';
      return;
    }
    container.innerHTML = '<div class="blog-index-head" style="background:rgba(148,163,255,.05);color:var(--text-faint)">' +
      '<span class="blog-index-num">' + S.escapeHtml(st.blogIndexLabel || 'FIELD NOTE INDEX') + '</span>' +
      '<span class="blog-index-title" style="font-size:9px;letter-spacing:.2em">TITLE</span>' +
      '<span class="blog-index-date">DATE</span><span class="blog-index-cat">TAG</span><span class="blog-arrow"></span></div>' +
      posts.map(function (p, i) {
        return '<button class="blog-index-head" data-slug="' + S.escapeHtml(p.slug) + '">' +
          '<span class="blog-index-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="blog-index-title">' + S.escapeHtml(p.title) + (p.published === false ? ' <span class="blog-draft-tag">' + S.escapeHtml(st.blogDraftLabel || 'DRAFT') + '</span>' : '') + '</span>' +
          '<span class="blog-index-date">' + S.escapeHtml(p.date || '') + '</span>' +
          '<span class="blog-index-cat">' + S.escapeHtml(p.category || st.blogEntryLabel || 'FIELD NOTE') + '</span>' +
          '<span class="blog-arrow">' + S.icon('arrow') + '</span>' +
          '</button>';
      }).join('');
    container.querySelectorAll('.blog-index-head[data-slug]').forEach(function (row) {
      row.addEventListener('click', function () { openNote(row.getAttribute('data-slug')); });
    });
  }

  /* ---------- note detail ---------- */
  function openNote(slug) {
    var view = document.getElementById('note-view');
    var body = document.body;
    view.style.display = 'block';
    view.innerHTML = '<div class="note-loading" style="text-align:center;padding:80px 0;color:var(--text-faint);font-family:var(--mono);letter-spacing:.3em;font-size:11px">LOADING FIELD NOTE ...</div>';
    view.scrollIntoView({ behavior: 'instant' });
    body.style.overflow = '';
    fetch('data/posts/' + encodeURIComponent(slug) + '.md').then(function (r) {
      if (!r.ok) throw new Error('not found');
      return r.text();
    }).then(function (md) {
      var meta = null;
      var lines = md.split('\n');
      var start = 0;
      if (lines[0].trim() === '---') {
        var end = lines.indexOf('---', 1);
        if (end > 0) {
          var front = lines.slice(1, end);
          meta = {};
          front.forEach(function (l) {
            var mm = l.match(/^(\w+):\s*["']?(.*?)["']?\s*$/);
            if (mm) meta[mm[1]] = mm[2];
          });
          start = end + 1;
        }
      }
      var content = lines.slice(start).join('\n');
      var title = (meta && meta.title) || slug;
      var date = (meta && meta.date) || '';
      var cat = (meta && meta.category) || st.blogEntryLabel || 'FIELD NOTE';
      var isDraft = meta && (meta.published === 'false' || meta.published === 'no');
      view.innerHTML =
        '<a class="note-back" href="javascript:void(0)" id="note-close">' + S.icon('back') + ' ' + S.escapeHtml(st.friendsBackLabel || 'RETURN TO ARCHIVE') + '</a>' +
        '<article><div class="note-head">' +
        '<span class="note-kicker">' + S.escapeHtml(st.blogEntryLabel || 'FIELD NOTE') + ' / ' + S.escapeHtml(cat) + '</span>' +
        '<h1>' + S.escapeHtml(title) + (isDraft ? ' <span class="blog-draft-tag">' + S.escapeHtml(st.blogDraftLabel || 'DRAFT') + '</span>' : '') + '</h1>' +
        '<span class="note-date">' + S.escapeHtml(date) + '</span></div>' +
        '<div class="note-body">' + S.renderMarkdown(content) + '</div></article>';
      document.getElementById('note-close').addEventListener('click', closeNote);
      view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () {
      view.innerHTML = '<a class="note-back" href="javascript:void(0)" id="note-close">' + S.icon('back') + ' BACK</a>' +
        '<div class="no-results"><h4>NOTE NOT FOUND</h4></div>';
      document.getElementById('note-close').addEventListener('click', closeNote);
    });
    if (window.location.hash !== '#note-' + slug) {
      try { history.replaceState(null, '', '#note-' + slug); } catch (e) { /* ignore */ }
    }
  }

  function closeNote() {
    document.getElementById('note-view').style.display = 'none';
    try { history.replaceState(null, '', window.location.pathname); } catch (e) { /* ignore */ }
    document.getElementById('records').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* hash route */
  function handleHash() {
    var h = window.location.hash;
    if (h.indexOf('#note-') === 0) {
      openNote(decodeURIComponent(h.slice(6)));
    } else if (h.indexOf('#records-') === 0) {
      var tab = h.slice(9);
      if (['anime', 'watchlist', 'blog'].indexOf(tab) > -1) {
        setTab(tab);
        var rec = document.getElementById('records');
        if (rec) rec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  window.addEventListener('hashchange', handleHash);

  /* ---------- init ---------- */
  function init() {
    var initial = 'anime';
    try {
      var q = new URLSearchParams(window.location.search).get('tab');
      if (q && ['anime', 'watchlist', 'blog'].indexOf(q) > -1) initial = q;
      else {
        var h = window.location.hash;
        if (h.indexOf('#records-') === 0 && ['anime', 'watchlist', 'blog'].indexOf(h.slice(9)) > -1) initial = h.slice(9);
      }
    } catch (e) { /* ignore */ }
    setTab(initial);
    S.initBoot();
    S.initReveal();
    S.initTopbar();
    S.applyFooter(data);
    handleHash();
    if (window.MALStarfield) {
      var c = document.getElementById('cosmos-canvas');
      if (c) new MALStarfield(c);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
