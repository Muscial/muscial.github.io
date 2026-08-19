/* MAL Doctor Console — client-side admin (localStorage persisted) */
(function () {
  'use strict';
  var S = window.MAL;
  var data = S.loadData();
  var st = S.settings(data);
  var VIEWS = ['dashboard', 'anime', 'watchlist', 'blog', 'friends', 'top', 'settings'];
  var currentView = 'dashboard';

  var BGM = {
    search: function (q) {
      return fetch('https://api.bgm.tv/v0/search/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ keyword: q, sort: 'match', filter: { type: [2] } })
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { return j.data || []; });
    },
    get: function (id) {
      return fetch('https://api.bgm.tv/v0/subjects/' + id, { headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }
  };

  /* ---------- helpers ---------- */
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function toast(msg, isErr) {
    var wrap = $('#toast-wrap');
    var el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(function () { el.remove(); }, 3100);
  }

  function persist() { S.saveData(data); }

  function nextId(list) {
    var max = 0;
    list.forEach(function (x) { if (x.id > max) max = x.id; });
    return max + 1;
  }

  function esc(s) { return S.escapeHtml(s); }

  function miniCover(a) {
    return '<div class="mini-cover">' +
      (a.imageUrl ? '<img src="' + esc(a.imageUrl) + '" alt="">' : '') +
      '<span class="cover-fallback" style="display:' + (a.imageUrl ? 'none' : 'grid') + '">' + S.avatarInitial(a.titleCn) + '</span></div>';
  }

  function sw() {
    return '<span class="spin" style="display:inline-block"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></span>';
  }

  function viewHead(title, crumb) {
    return '<h1>' + esc(title) + '</h1><p class="crumb">' + esc(crumb || '') + '</p>';
  }

  /* ---------- auth ---------- */
  function isAuthed() {
    try { return sessionStorage.getItem('mal-doctor') === '1'; } catch (e) { return false; }
  }
  function showLogin() {
    $('#console-loading').style.display = 'none';
    $('#login-wrap').style.display = 'grid';
    $('#console').style.display = 'none';
  }
  function showConsole() {
    $('#console-loading').style.display = 'none';
    $('#login-wrap').style.display = 'none';
    $('#console').style.display = 'block';
    switchView(currentView);
  }

  function initAuth() {
    if (isAuthed()) { showConsole(); return; }
    showLogin();
    function attempt() {
      var tok = $('#login-token').value.trim();
      var expect = (st.adminToken || '').trim();
      if (!expect) { $('#login-err').textContent = 'ADMIN TOKEN NOT CONFIGURED (settings.adminToken)'; return; }
      if (tok === expect) {
        try { sessionStorage.setItem('mal-doctor', '1'); } catch (e) { /* ignore */ }
        showConsole();
      } else {
        $('#login-err').textContent = 'INVALID ACCESS TOKEN';
      }
    }
    $('#login-btn').addEventListener('click', attempt);
    $('#login-token').addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
    $('#logout-btn').addEventListener('click', function () {
      try { sessionStorage.removeItem('mal-doctor'); } catch (e) { /* ignore */ }
      showLogin();
    });
  }

  /* ---------- sidebar ---------- */
  function bindSidebar() {
    $$('.side-btn[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); });
    });
  }
  function switchView(v) {
    if (VIEWS.indexOf(v) === -1) v = 'dashboard';
    currentView = v;
    $$('.side-btn[data-view]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === v); });
    var main = $('#console-main');
    main.innerHTML = '';
    var fns = {
      dashboard: viewDashboard, anime: viewAnime, watchlist: viewWatchlist,
      blog: viewBlog, friends: viewFriends, top: viewTop, settings: viewSettings
    };
    fns[v](main);
  }

  /* ---------- dashboard ---------- */
  function viewDashboard(main) {
    var stats = S.computeStats(data);
    main.innerHTML = viewHead('DASHBOARD', 'ARCHIVE CORE / STATUS REPORT') +
      '<div class="notice">数据存储在浏览器 localStorage 中（键 <b>mal-data-v1</b>），仅在当前设备生效。' +
      '编辑完成后，请在 <b>SETTINGS</b> 中导出 JSON，将内容替换到 <b>data/site-data.js</b> 的 <b>window.SEED_DATA</b> 中并提交，即可在所有访客端生效。</div>' +
      '<div class="stat-row">' +
      '<div class="mini-stat"><div class="v">' + stats.total + '</div><div class="k">ANIME TITLES</div></div>' +
      '<div class="mini-stat"><div class="v">' + (data.watchlist || []).length + '</div><div class="k">WATCHLIST</div></div>' +
      '<div class="mini-stat"><div class="v">' + stats.blogCount + '</div><div class="k">FIELD NOTES</div></div>' +
      '<div class="mini-stat"><div class="v">' + (data.friends || []).length + '</div><div class="k">FRIENDS</div></div>' +
      '<div class="mini-stat"><div class="v">' + stats.averageScore.toFixed(1) + '</div><div class="k">AVG SCORE</div></div>' +
      '</div>' +
      '<div class="toolbar">' +
      '<button class="cbtn" id="db-sync">' + S.icon('refresh') + ' COVERS SYNC</button>' +
      '<button class="cbtn ghost" id="db-export">EXPORT JSON</button>' +
      '<button class="cbtn ghost" id="db-import">IMPORT JSON</button>' +
      '<button class="cbtn danger" id="db-reset">RESET TO SEED</button>' +
      '<input type="file" id="db-import-file" accept="application/json,.json" style="display:none">' +
      '</div>';
    $('#db-sync').addEventListener('click', syncCovers);
    $('#db-export').addEventListener('click', function () { exportJson(); });
    $('#db-import').addEventListener('click', function () { $('#db-import-file').click(); });
    $('#db-import-file').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          if (!obj || typeof obj !== 'object' || !obj.anime) throw new Error('bad');
          data = obj;
          persist();
          toast('DATA IMPORTED');
          switchView('dashboard');
        } catch (err) { toast('INVALID JSON FILE', true); }
      };
      rd.readAsText(f);
    });
    $('#db-reset').addEventListener('click', function () {
      if (!confirm('确定恢复为种子数据？当前本地修改将被丢弃。')) return;
      data = JSON.parse(JSON.stringify(window.SEED_DATA));
      S.resetData();
      toast('RESET TO SEED');
      switchView('dashboard');
    });
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mal-data.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  /* ---------- covers sync ---------- */
  function syncCovers() {
    var btn = $('#db-sync');
    var list = data.anime.filter(function (a) { return a.bangumiId; });
    if (!list.length) { toast('NO ANIME RECORDS'); return; }
    btn.disabled = true;
    var done = 0, failed = 0;
    function step(i) {
      if (i >= list.length) {
        btn.disabled = false;
        toast('COVERS SYNC DONE: ' + done + ' OK, ' + failed + ' FAILED');
        persist();
        return;
      }
      BGM.get(list[i].bangumiId).then(function (s) {
        if (s && s.images && s.images.large) { list[i].imageUrl = s.images.large; done++; }
        else failed++;
      }).catch(function () { failed++; }).then(function () {
        step(i + 1);
      });
    }
    step(0);
  }

  /* ---------- anime ---------- */
  function viewAnime(main) {
    var sorted = data.anime.slice().sort(function (a, b) {
      return (a.watchedYear - b.watchedYear) || (a.titleCn || '').localeCompare(b.titleCn || '', 'zh');
    });
    main.innerHTML = viewHead('ANIME ARCHIVE', 'RECORDS / ' + sorted.length + ' TITLES') +
      '<div class="toolbar">' +
      '<button class="cbtn" id="anime-add">' + S.icon('plus') + ' ADD VIA BANGUMI SEARCH</button>' +
      '<button class="cbtn ghost" id="anime-add-manual">' + S.icon('plus') + ' MANUAL</button>' +
      '<input class="cinput wide" id="anime-filter" placeholder="过滤标题 / 年份 ...">' +
      '</div>' +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr>' +
      '<th>#</th><th>COVER</th><th>TITLE</th><th>YEAR</th><th>SCORE</th><th>TOP</th><th></th>' +
      '</tr></thead><tbody id="anime-rows"></tbody></table></div>';

    function renderRows(filter) {
      filter = (filter || '').toLowerCase();
      var rows = sorted.filter(function (a) {
        if (!filter) return true;
        return (a.titleCn + ' ' + (a.titleOriginal || '') + ' ' + (a.watchedYear || '')).toLowerCase().indexOf(filter) > -1;
      });
      var topIds = data.top || [];
      $('#anime-rows').innerHTML = rows.map(function (a) {
        var rank = topIds.indexOf(a.id) + 1;
        return '<tr>' +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">' + esc(S.serializeNumber(sorted.indexOf(a))) + '</td>' +
          '<td>' + miniCover(a) + '</td>' +
          '<td><div style="font-size:13px">' + esc(a.titleCn) + '</div>' +
          '<div style="font-family:var(--mono);font-size:9px;color:var(--text-faint)">' + esc(a.titleOriginal || '') + '</div></td>' +
          '<td style="font-family:var(--mono);font-size:12px">' + (a.watchedYear || '—') + '</td>' +
          '<td style="font-family:var(--mono);font-size:12px;color:var(--accent)">' + (a.score != null ? a.score : '—') + '</td>' +
          '<td>' + (rank ? '<span class="tag top">TOP ' + rank + '</span>' : '') + '</td>' +
          '<td><div class="row-actions">' +
          '<button class="ra" data-act="edit" data-id="' + a.id + '" title="编辑">' + S.icon('edit') + '</button>' +
          '<button class="ra del" data-act="del" data-id="' + a.id + '" title="删除">' + S.icon('trash') + '</button>' +
          '</div></td></tr>';
      }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-faint);padding:30px">NO RECORDS</td></tr>';
      $$('#anime-rows [data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = parseInt(b.getAttribute('data-id'), 10);
          if (b.getAttribute('data-act') === 'edit') animeEdit(id);
          else animeDelete(id);
        });
      });
    }
    renderRows('');
    $('#anime-filter').addEventListener('input', function () { renderRows(this.value); });
    $('#anime-add').addEventListener('click', function () { bgmSearchModal(false); });
    $('#anime-add-manual').addEventListener('click', function () { animeEdit(null); });
  }

  function animeDelete(id) {
    var a = data.anime.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    if (!confirm('删除《' + a.titleCn + '》？')) return;
    data.anime = data.anime.filter(function (x) { return x.id !== id; });
    data.top = (data.top || []).filter(function (t) { return t !== id; });
    persist();
    toast('DELETED');
    switchView('anime');
  }

  function animeEdit(id) {
    var a = id != null ? data.anime.filter(function (x) { return x.id === id; })[0] : null;
    openModal((a ? 'EDIT RECORD' : 'NEW RECORD') + ' / ANIME', '' +
      '<div class="form-grid">' +
      field('bangumiId', 'BANGUMI ID', 'input', a ? a.bangumiId : '', 'number') +
      field('titleCn', '中文标题 *', 'input', a ? a.titleCn : '') +
      field('titleOriginal', '原始标题', 'input', a ? a.titleOriginal : '') +
      field('watchedYear', '观看年份', 'input', a ? a.watchedYear : '', 'number') +
      field('airDate', '首播日期', 'input', a ? a.airDate : '', 'date') +
      field('score', '个人评分', 'input', a != null && a.score != null ? a.score : '', 'number', '0-10') +
      field('imageUrl', '封面 URL', 'input', a ? a.imageUrl : '') +
      field('topRank', 'TOP10 排名(1-10, 留空不加)', 'input', a ? (a.topRank || '') : '', 'number') +
      field('summary', '简介', 'textarea', a ? a.summary : '', '', 'full') +
      field('note', '备注', 'textarea', a ? a.note : '', '', 'full') +
      '</div>', function (get) {
      var rec = {
        id: a ? a.id : nextId(data.anime),
        bangumiId: parseInt(get('bangumiId'), 10) || 0,
        titleCn: get('titleCn').trim() || '未命名',
        titleOriginal: get('titleOriginal').trim(),
        watchedYear: parseInt(get('watchedYear'), 10) || null,
        airDate: get('airDate'),
        score: get('score') === '' ? null : parseFloat(get('score')),
        imageUrl: get('imageUrl').trim(),
        bangumiUrl: 'https://bgm.tv/subject/' + (parseInt(get('bangumiId'), 10) || 0),
        summary: get('summary'),
        note: get('note'),
        sortTitle: get('titleCn').trim() || '未命名'
      };
      var rank = parseInt(get('topRank'), 10);
      if (rank >= 1 && rank <= 10) { rec.topRank = rank; data.top = data.top || []; }
      if (a) {
        data.anime = data.anime.map(function (x) { return x.id === a.id ? Object.assign({}, x, rec) : x; });
      } else {
        data.anime.push(rec);
      }
      if (rank >= 1 && rank <= 10) {
        data.top = (data.top || []).filter(function (t) { return t !== rec.id; });
        data.top.push(rec.id);
      }
      persist();
      toast('SAVED');
      switchView('anime');
    });
  }

  function field(name, label, type, value, extra, cls) {
    var v = value == null ? '' : String(value).replace(/"/g, '&quot;');
    var ext = extra ? ' ' + extra : '';
    if (type === 'textarea') {
      return '<div class="form-field ' + (cls || '') + '"><label>' + esc(label) + '</label>' +
        '<textarea data-f="' + name + '">' + v + '</textarea></div>';
    }
    if (type === 'select') { return ''; }
    return '<div class="form-field ' + (cls || '') + '"><label>' + esc(label) + '</label>' +
      '<input data-f="' + name + '" type="' + type + '" value="' + v + '"' + ext + '></div>';
  }

  /* ---------- bgm search modal ---------- */
  function bgmSearchModal(isWatchlist) {
    openModal('BANGUMI SEARCH', '' +
      '<div class="toolbar">' +
      '<input class="cinput wide" id="bgm-q" placeholder="输入关键词，如：进击的巨人">' +
      '<button class="cbtn" id="bgm-go">' + S.icon('refresh') + ' SEARCH</button>' +
      '</div>' +
      '<div class="bgm-results" id="bgm-results"><div style="color:var(--text-faint);font-family:var(--mono);font-size:11px;padding:20px 0;text-align:center">输入关键词搜索 Bangumi 条目</div></div>',
      null, true);
    var doSearch = function () {
      var q = $('#bgm-q').value.trim();
      if (!q) return;
      var box = $('#bgm-results');
      box.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-family:var(--mono);font-size:11px">' + sw() + ' SEARCHING ...</div>';
      BGM.search(q).then(function (items) {
        if (!items.length) { box.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center">NO MATCH</div>'; return; }
        box.innerHTML = items.map(function (it) {
          return '<div class="bgm-item" data-id="' + it.id + '" data-name="' + esc(it.name_cn || it.name || '') + '">' +
            '<img src="' + esc((it.images && it.images.medium) || '') + '" alt="">' +
            '<div style="flex:1;min-width:0"><div class="bi-name">' + esc(it.name_cn || it.name || '') + '</div>' +
            '<div class="bi-name" style="font-family:var(--serif);font-size:11px;color:var(--text-faint)">' + esc(it.name || '') + '</div>' +
            '<div class="bi-meta">ID ' + it.id + ' · ' + (it.date || 'DATE N/A') + ' · RANK ' + (it.rank || '—') + '</div></div>' +
            '</div>';
        }).join('');
        $$('#bgm-results .bgm-item').forEach(function (el) {
          el.addEventListener('click', function () {
            bgmAdd(el.getAttribute('data-id'), el.getAttribute('data-name'), isWatchlist);
          });
        });
      }).catch(function (e) {
        box.innerHTML = '<div style="color:var(--danger);padding:20px;text-align:center;font-family:var(--mono);font-size:11px">BANGUMI API 不可达 (' + e.message + ')。请稍后重试。</div>';
      });
    };
    $('#bgm-go').addEventListener('click', doSearch);
    $('#bgm-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
  }

  function bgmAdd(bid, fallbackName, isWatchlist) {
    BGM.get(bid).then(function (s) {
      var rec = {
        id: nextId(data.anime),
        bangumiId: s.id,
        titleCn: s.name_cn || s.name || fallbackName || '未命名',
        titleOriginal: s.name || '',
        watchedYear: s.date ? parseInt(s.date.slice(0, 4), 10) : null,
        airDate: s.date || '',
        score: null,
        imageUrl: (s.images && s.images.large) || '',
        bangumiUrl: 'https://bgm.tv/subject/' + s.id,
        summary: (s.summary || '').slice(0, 800),
        note: '',
        sortTitle: s.name_cn || s.name || ''
      };
      if (isWatchlist) {
        var wrec = {
          id: nextId(data.watchlist || []),
          bangumiId: s.id,
          titleCn: rec.titleCn,
          titleOriginal: rec.titleOriginal,
          airDate: rec.airDate,
          seasonYear: rec.watchedYear,
          seasonMonth: s.date ? parseInt(s.date.slice(5, 7), 10) : 1,
          imageUrl: rec.imageUrl,
          bangumiUrl: rec.bangumiUrl,
          expectationScore: 7,
          expectationNote: '',
          bangumiScore: null,
          bgmRank: null,
          sortTitle: rec.sortTitle
        };
        data.watchlist = data.watchlist || [];
        data.watchlist.push(wrec);
        toast('ADDED TO WATCHLIST');
      } else {
        data.anime.push(rec);
        toast('ADDED: ' + rec.titleCn);
      }
      persist();
      closeModal();
      switchView(isWatchlist ? 'watchlist' : 'anime');
    }).catch(function (e) {
      toast('BANGUMI API 不可达: ' + e.message, true);
    });
  }

  /* ---------- modal ---------- */
  var modalEl = null;
  function openModal(title, body, onSave, noSave) {
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.className = 'modal';
      modalEl.innerHTML = '<div class="modal-card"><div class="modal-head"><h2 id="modal-title"></h2>' +
        '<button class="modal-close" id="modal-x">&times;</button></div>' +
        '<div id="modal-body"></div>' +
        '<div class="form-actions" id="modal-actions"></div></div>';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });
      $('#modal-x').addEventListener('click', closeModal);
    }
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    var actions = $('#modal-actions');
    actions.innerHTML = noSave ? '' :
      '<button class="cbtn ghost" id="modal-cancel">CANCEL</button>' +
      '<button class="cbtn" id="modal-save">SAVE</button>';
    var cancel = $('#modal-cancel');
    if (cancel) cancel.addEventListener('click', closeModal);
    var save = $('#modal-save');
    if (save) save.addEventListener('click', function () {
      var get = function (name) {
        var el = $('#modal-body [data-f="' + name + '"]');
        return el ? el.value : '';
      };
      try { onSave(get); } catch (e) { toast('SAVE ERROR: ' + e.message, true); }
    });
    modalEl.classList.add('open');
    var first = modalEl.querySelector('input,textarea');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    if (modalEl) modalEl.classList.remove('open');
  }

  /* ---------- watchlist ---------- */
  function viewWatchlist(main) {
    var wl = (data.watchlist || []).slice().sort(function (a, b) {
      return (b.seasonYear - a.seasonYear) || (b.seasonMonth - a.seasonMonth);
    });
    main.innerHTML = viewHead('WATCHLIST / BACKLOG', 'PENDING / ' + wl.length + ' TITLES') +
      '<div class="toolbar">' +
      '<button class="cbtn" id="wl-add">' + S.icon('plus') + ' ADD VIA BANGUMI SEARCH</button>' +
      '<button class="cbtn ghost" id="wl-add-manual">' + S.icon('plus') + ' MANUAL</button>' +
      '</div>' +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr>' +
      '<th>COVER</th><th>TITLE</th><th>SEASON</th><th>EXPECT</th><th>BGM</th><th></th>' +
      '</tr></thead><tbody>' + wl.map(function (w) {
        return '<tr>' +
          '<td>' + miniCover(w) + '</td>' +
          '<td><div style="font-size:13px">' + esc(w.titleCn) + '</div>' +
          '<div style="font-family:var(--mono);font-size:9px;color:var(--text-faint)">' + esc(w.titleOriginal || '') + '</div></td>' +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--text-dim)">' + (w.seasonYear || '—') + ' ' + S.seasonOf(w.seasonMonth || 1) + '</td>' +
          '<td style="font-family:var(--mono);font-size:12px;color:var(--accent-2)">' + (w.expectationScore != null ? w.expectationScore.toFixed(1) : '—') + '</td>' +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">' + (w.bangumiScore != null ? w.bangumiScore : '—') + (w.bgmRank ? ' / #' + w.bgmRank : '') + '</td>' +
          '<td><div class="row-actions">' +
          '<button class="ra" data-act="complete" data-id="' + w.id + '" title="标记看完，移入动画列表">' + S.icon('check') + '</button>' +
          '<button class="ra" data-act="edit" data-id="' + w.id + '" title="编辑">' + S.icon('edit') + '</button>' +
          '<button class="ra del" data-act="del" data-id="' + w.id + '" title="删除">' + S.icon('trash') + '</button>' +
          '</div></td></tr>';
      }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px">BACKLOG IS CLEAR</td></tr>' +
      '</tbody></table></div>';
    $$('#watchlist-tbody') && null;
    var tbody = main.querySelector('tbody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var id = parseInt(b.getAttribute('data-id'), 10);
        var act = b.getAttribute('data-act');
        if (act === 'complete') wlComplete(id);
        else if (act === 'edit') wlEdit(id);
        else wlDelete(id);
      });
    }
    $('#wl-add').addEventListener('click', function () { bgmSearchModal(true); });
    $('#wl-add-manual').addEventListener('click', function () { wlEdit(null); });
  }

  function wlComplete(id) {
    var w = (data.watchlist || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    if (!confirm('将《' + w.titleCn + '》标记为已看完并移入 ANIME LIST？')) return;
    data.anime.push({
      id: nextId(data.anime),
      bangumiId: w.bangumiId,
      titleCn: w.titleCn,
      titleOriginal: w.titleOriginal,
      watchedYear: w.seasonYear || (w.airDate ? parseInt(w.airDate.slice(0, 4), 10) : null),
      airDate: w.airDate,
      score: null,
      imageUrl: w.imageUrl,
      bangumiUrl: w.bangumiUrl,
      summary: w.summary || '',
      note: '',
      sortTitle: w.sortTitle || w.titleCn
    });
    data.watchlist = data.watchlist.filter(function (x) { return x.id !== id; });
    persist();
    toast('MOVED TO ANIME LIST');
    switchView('watchlist');
  }

  function wlEdit(id) {
    var w = id != null ? (data.watchlist || []).filter(function (x) { return x.id === id; })[0] : null;
    openModal((w ? 'EDIT' : 'NEW') + ' / WATCHLIST', '' +
      '<div class="form-grid">' +
      field('titleCn', '中文标题 *', 'input', w ? w.titleCn : '') +
      field('titleOriginal', '原始标题', 'input', w ? w.titleOriginal : '') +
      field('bangumiId', 'BANGUMI ID', 'input', w ? w.bangumiId : '', 'number') +
      field('airDate', '首播日期', 'input', w ? w.airDate : '', 'date') +
      field('seasonYear', '季度年份', 'input', w ? w.seasonYear : '', 'number') +
      field('seasonMonth', '季度月份(1/4/7/10)', 'input', w ? w.seasonMonth : '', 'number') +
      field('expectationScore', '期待值(0-10)', 'input', w != null && w.expectationScore != null ? w.expectationScore : '7', 'number', 'step=0.1') +
      field('imageUrl', '封面 URL', 'input', w ? w.imageUrl : '') +
      field('expectationNote', '期待备注', 'textarea', w ? w.expectationNote : '', '', 'full') +
      '</div>', function (get) {
      var rec = {
        id: w ? w.id : nextId(data.watchlist || []),
        bangumiId: parseInt(get('bangumiId'), 10) || 0,
        titleCn: get('titleCn').trim() || '未命名',
        titleOriginal: get('titleOriginal').trim(),
        airDate: get('airDate'),
        seasonYear: parseInt(get('seasonYear'), 10) || null,
        seasonMonth: parseInt(get('seasonMonth'), 10) || 1,
        expectationScore: get('expectationScore') === '' ? 7 : parseFloat(get('expectationScore')),
        expectationNote: get('expectationNote'),
        imageUrl: get('imageUrl').trim(),
        bangumiUrl: 'https://bgm.tv/subject/' + (parseInt(get('bangumiId'), 10) || 0),
        bangumiScore: w ? w.bangumiScore : null,
        bgmRank: w ? w.bgmRank : null,
        sortTitle: get('titleCn').trim() || '未命名'
      };
      data.watchlist = data.watchlist || [];
      if (w) data.watchlist = data.watchlist.map(function (x) { return x.id === w.id ? Object.assign({}, x, rec) : x; });
      else data.watchlist.push(rec);
      persist();
      toast('SAVED');
      switchView('watchlist');
    });
  }

  function wlDelete(id) {
    var w = (data.watchlist || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    if (!confirm('删除《' + w.titleCn + '》？')) return;
    data.watchlist = data.watchlist.filter(function (x) { return x.id !== id; });
    persist();
    toast('DELETED');
    switchView('watchlist');
  }

  /* ---------- blog ---------- */
  function allBlogs() {
    var filePosts = S.getPostsIndex().map(function (p) {
      return { id: 'f:' + p.slug, slug: p.slug, title: p.title, date: p.date, category: p.category, published: p.published !== false, draft: p.published === false, fromFile: true };
    });
    var dbPosts = (data.blogs || []).map(function (b) {
      return { id: 'd:' + b.slug, slug: b.slug, title: b.title, date: (b.publishedAt || b.date || '').slice(0, 10), category: b.category || '杂谈', published: b.published !== false, draft: b.published === false, fromFile: false };
    });
    return filePosts.concat(dbPosts).sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  function viewBlog(main) {
    var blogs = allBlogs();
    var dbCount = (data.blogs || []).length;
    main.innerHTML = viewHead('FIELD NOTES / BLOG', 'NOTES / ' + blogs.length + ' (' + dbCount + ' DB)') +
      '<div class="toolbar">' +
      '<button class="cbtn" id="blog-new">' + S.icon('plus') + ' NEW NOTE (DB)</button>' +
      '<span style="font-family:var(--mono);font-size:10px;color:var(--text-faint);letter-spacing:.1em">文件型笔记在 data/posts/*.md 中管理</span>' +
      '</div>' +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr>' +
      '<th>TITLE</th><th>CATEGORY</th><th>DATE</th><th>STATUS</th><th></th>' +
      '</tr></thead><tbody>' + blogs.map(function (b) {
        return '<tr>' +
          '<td><div style="font-size:13px">' + esc(b.title) + '</div>' +
          '<div style="font-family:var(--mono);font-size:9px;color:var(--text-faint)">' + esc(b.slug) + (b.fromFile ? ' · FILE' : ' · DB') + '</div></td>' +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--text-dim)">' + esc(b.category || '') + '</td>' +
          '<td style="font-family:var(--mono);font-size:11px;color:var(--text-faint)">' + esc(b.date || '—') + '</td>' +
          '<td>' + (b.draft ? '<span class="tag draft">DRAFT</span>' : '<span class="tag ok">PUBLISHED</span>') + '</td>' +
          '<td><div class="row-actions">' +
          (b.fromFile
            ? '<button class="ra" data-act="view" data-slug="' + esc(b.slug) + '" title="查看">' + S.icon('eye') + '</button>'
            : '<button class="ra" data-act="edit" data-slug="' + esc(b.slug) + '" title="编辑">' + S.icon('edit') + '</button>' +
              '<button class="ra del" data-act="del" data-slug="' + esc(b.slug) + '" title="删除">' + S.icon('trash') + '</button>') +
          '</div></td></tr>';
      }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:30px">NO NOTES</td></tr>' +
      '</tbody></table></div>';
    main.querySelector('tbody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var slug = b.getAttribute('data-slug');
      var act = b.getAttribute('data-act');
      if (act === 'edit') blogEdit(slug);
      else if (act === 'del') blogDelete(slug);
      else if (act === 'view') window.open('index.html#note-' + slug, '_blank');
    });
    $('#blog-new').addEventListener('click', function () { blogEdit(null); });
  }

  function blogEdit(slug) {
    var b = null;
    if (slug) {
      var list = data.blogs || [];
      for (var i = 0; i < list.length; i++) if (list[i].slug === slug) { b = list[i]; break; }
    }
    openModal((b ? 'EDIT' : 'NEW') + ' / FIELD NOTE', '' +
      '<div class="form-grid">' +
      field('title', '标题 *', 'input', b ? b.title : '') +
      field('slug', 'SLUG（URL 标识）*', 'input', b ? b.slug : '') +
      field('date', '发布日期', 'input', b ? (b.publishedAt || b.date || '').slice(0, 10) : new Date().toISOString().slice(0, 10), 'date') +
      field('category', '分类', 'input', b ? (b.category || '') : '杂谈') +
      '</div>' +
      '<div class="form-field" style="margin:14px 0 6px"><label>正文 (MARKDOWN)</label></div>' +
      '<div class="editor-wrap">' +
      '<textarea id="blog-content" style="background:rgba(4,5,12,.7);border:1px solid var(--line);color:var(--text);padding:12px;border-radius:10px;font-family:var(--mono);font-size:12px;line-height:1.6;outline:none">' + (b ? b.content : '') + '</textarea>' +
      '<div class="preview-pane"><div class="note-body" id="blog-preview"></div></div>' +
      '</div>', function (get) {
      var content = $('#blog-content').value;
      var rec = {
        slug: get('slug').trim() || ('note-' + Date.now()),
        title: get('title').trim() || '未命名',
        category: get('category').trim() || '杂谈',
        published: true,
        layout: 'prose',
        content: content,
        publishedAt: (get('date') || new Date().toISOString().slice(0, 10)) + 'T00:00:00.000Z',
        excerpt: content.replace(/\s+/g, ' ').replace(/[#*`>\[\]()!-]/g, '').slice(0, 120)
      };
      data.blogs = data.blogs || [];
      if (b) data.blogs = data.blogs.map(function (x) { return x.slug === b.slug ? Object.assign({}, x, rec) : x; });
      else data.blogs.push(rec);
      persist();
      toast('SAVED');
      switchView('blog');
    });
    var ta = document.getElementById('blog-content');
    var pv = document.getElementById('blog-preview');
    var render = function () { pv.innerHTML = S.renderMarkdown(ta.value); };
    ta.addEventListener('input', render);
    render();
  }

  function blogDelete(slug) {
    if (!confirm('删除笔记 "' + slug + '"？')) return;
    data.blogs = (data.blogs || []).filter(function (x) { return x.slug !== slug; });
    persist();
    toast('DELETED');
    switchView('blog');
  }

  /* ---------- friends ---------- */
  function viewFriends(main) {
    var friends = data.friends || [];
    var prof = data.profile || {};
    main.innerHTML = viewHead('FRIENDS / LINKED CONSTELLATIONS', 'LINKS / ' + friends.length) +
      '<div class="toolbar">' +
      '<button class="cbtn" id="fr-new">' + S.icon('plus') + ' NEW FRIEND</button>' +
      '<button class="cbtn ghost" id="fr-profile">PROFILE SETTINGS</button>' +
      '</div>' +
      '<div class="ctable-wrap"><table class="ctable"><thead><tr>' +
      '<th>AVATAR</th><th>ID / NAME</th><th>URL</th><th>DESCRIPTION</th><th>VISIBLE</th><th></th>' +
      '</tr></thead><tbody>' + friends.map(function (f) {
        return '<tr>' +
          '<td>' + miniCover(f) + '</td>' +
          '<td><div style="font-size:13px">' + esc(f.name || '') + '</div>' +
          '<div style="font-family:var(--mono);font-size:9px;color:var(--text-faint)">' + esc(f.id || '') + '</div></td>' +
          '<td style="font-family:var(--mono);font-size:10px"><a href="' + esc(f.url || '#') + '" target="_blank" rel="noopener">' + esc((f.url || '').replace(/^https?:\/\//, '')) + '</a></td>' +
          '<td style="font-size:12px;color:var(--text-dim)">' + esc(f.description || '') + '</td>' +
          '<td>' + (f.visible === false ? '<span class="tag draft">HIDDEN</span>' : '<span class="tag ok">VISIBLE</span>') + '</td>' +
          '<td><div class="row-actions">' +
          '<button class="ra" data-act="edit" data-id="' + esc(f.id) + '" title="编辑">' + S.icon('edit') + '</button>' +
          '<button class="ra del" data-act="del" data-id="' + esc(f.id) + '" title="删除">' + S.icon('trash') + '</button>' +
          '</div></td></tr>';
      }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px">NO LINKED SIGNALS</td></tr>' +
      '</tbody></table></div>';
    main.querySelector('tbody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.getAttribute('data-id');
      if (b.getAttribute('data-act') === 'edit') friendEdit(id);
      else friendDelete(id);
    });
    $('#fr-new').addEventListener('click', function () { friendEdit(null); });
    $('#fr-profile').addEventListener('click', profileEdit);
  }

  function friendEdit(id) {
    var f = id != null ? (data.friends || []).filter(function (x) { return x.id === id; })[0] : null;
    openModal((f ? 'EDIT' : 'NEW') + ' / FRIEND', '' +
      '<div class="form-grid">' +
      field('id', 'LINK ID *（英文小写）', 'input', f ? f.id : '') +
      field('name', '名称 *', 'input', f ? f.name : '') +
      field('url', '站点 URL', 'input', f ? f.url : '') +
      field('description', '一句话描述', 'input', f ? f.description : '') +
      field('avatar', '头像 URL（或留空用首字母）', 'input', f ? f.avatar : '') +
      field('visible', '可见（true/false）', 'input', f ? (f.visible !== false) : 'true') +
      '</div>', function (get) {
      var rec = {
        id: get('id').trim() || ('f' + Date.now()),
        name: get('name').trim() || '未命名',
        url: get('url').trim(),
        description: get('description').trim(),
        avatar: get('avatar').trim(),
        visible: get('visible').trim() !== 'false',
        sortOrder: f ? (f.sortOrder || 0) : 0
      };
      data.friends = data.friends || [];
      if (f) data.friends = data.friends.map(function (x) { return x.id === f.id ? Object.assign({}, x, rec) : x; });
      else data.friends.push(rec);
      persist();
      toast('SAVED');
      switchView('friends');
    });
  }

  function friendDelete(id) {
    if (!confirm('删除友链 "' + id + '"？')) return;
    data.friends = (data.friends || []).filter(function (x) { return x.id !== id; });
    persist();
    toast('DELETED');
    switchView('friends');
  }

  function profileEdit() {
    var p = data.profile || {};
    openModal('OBSERVER PROFILE', '' +
      '<div class="form-grid">' +
      field('displayName', '显示名 *', 'input', p.displayName) +
      field('handle', '称号', 'input', p.handle) +
      field('introduction', '简介', 'input', p.introduction) +
      field('location', '位置', 'input', p.location) +
      field('websiteLabel', '站点名', 'input', p.websiteLabel) +
      field('websiteUrl', '站点 URL', 'input', p.websiteUrl) +
      field('contactLabel', '联系方式标签', 'input', p.contactLabel) +
      field('contactValue', '联系方式', 'input', p.contactValue) +
      field('avatar', '头像 URL', 'input', p.avatar) +
      '</div>', function (get) {
      data.profile = {
        displayName: get('displayName').trim() || 'Muscial',
        handle: get('handle').trim(),
        introduction: get('introduction').trim(),
        location: get('location').trim(),
        websiteLabel: get('websiteLabel').trim(),
        websiteUrl: get('websiteUrl').trim(),
        contactLabel: get('contactLabel').trim(),
        contactValue: get('contactValue').trim(),
        avatar: get('avatar').trim()
      };
      persist();
      toast('SAVED');
      switchView('friends');
    });
  }

  /* ---------- top 10 ---------- */
  function viewTop(main) {
    var topIds = data.top || [];
    var byId = {};
    data.anime.forEach(function (a) { byId[a.id] = a; });
    main.innerHTML = viewHead('TOP 10 / PERSONAL PRIORITY', 'ORBIT / ' + topIds.length + ' SLOTS FILLED') +
      '<div class="notice">从上到下依次为第 1 ~ 10 名。点击左侧按钮上移 / 下移，或替换为其他作品。多季度可视为系列作品。</div>' +
      '<div class="top10-rows" id="top-rows"></div>' +
      '<div class="toolbar" style="margin-top:18px">' +
      '<button class="cbtn" id="top-save">SAVE ORDER</button>' +
      '<button class="cbtn ghost" id="top-clear">CLEAR ALL</button>' +
      '</div>';
    var rows = $('#top-rows');
    function renderRows() {
      rows.innerHTML = topIds.map(function (id, i) {
        var a = byId[id];
        var opts = data.anime.map(function (x) {
          return '<option value="' + x.id + '"' + (x.id === id ? ' selected' : '') + '>' + esc(x.titleCn) + '</option>';
        }).join('');
        return '<div class="top10-row" data-id="' + id + '">' +
          '<span class="rank">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<select class="cinput top-select" style="flex:1;min-width:0;padding:8px 10px">' + opts + '</select>' +
          '<div class="row-actions">' +
          '<button class="ra" data-act="up" title="上移">↑</button>' +
          '<button class="ra" data-act="down" title="下移">↓</button>' +
          '<button class="ra del" data-act="remove" title="移除">' + S.icon('trash') + '</button>' +
          '</div></div>';
      }).join('') || '<div style="color:var(--text-faint);font-family:var(--mono);font-size:11px;padding:30px 0;text-align:center">ORBIT EMPTY — 从 ANIME 列表中选择作品</div>';
      $$('#top-rows .top-select').forEach(function (sel, i) {
        sel.addEventListener('change', function () { topIds[i] = parseInt(sel.value, 10); });
      });
      $$('#top-rows [data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var row = b.closest('.top10-row');
          var idx = Array.prototype.indexOf.call(rows.children, row);
          var act = b.getAttribute('data-act');
          if (act === 'up' && idx > 0) { var t = topIds[idx - 1]; topIds[idx - 1] = topIds[idx]; topIds[idx] = t; }
          else if (act === 'down' && idx < topIds.length - 1) { var u = topIds[idx + 1]; topIds[idx + 1] = topIds[idx]; topIds[idx] = u; }
          else if (act === 'remove') topIds.splice(idx, 1);
          renderRows();
        });
      });
    }
    renderRows();
    $('#top-save').addEventListener('click', function () {
      var seen = {};
      var valid = topIds.filter(function (id) {
        if (seen[id] || !byId[id]) return false;
        seen[id] = 1;
        return true;
      });
      data.top = valid.slice(0, 10);
      data.anime.forEach(function (a) {
        a.topRank = valid.indexOf(a.id) + 1 || null;
      });
      persist();
      toast('TOP 10 SAVED');
      switchView('top');
    });
    $('#top-clear').addEventListener('click', function () {
      if (!confirm('清空 TOP 10？')) return;
      data.top = [];
      data.anime.forEach(function (a) { a.topRank = null; });
      persist();
      switchView('top');
    });
  }

  /* ---------- settings ---------- */
  function viewSettings(main) {
    main.innerHTML = viewHead('SETTINGS / ARCHIVE CONFIG', 'CONFIG KEYS / ' + Object.keys(data.settings || {}).length) +
      '<div class="notice">编辑站点配置。保存后立即生效（含已登录状态下的 adminToken 修改）。' +
      '可将完整数据导出为 JSON 后，替换 <b>data/site-data.js</b> 中的 <b>window.SEED_DATA</b> 以对全网生效。</div>' +
      '<div class="form-field" style="margin-bottom:14px"><label>settings JSON</label>' +
      '<textarea id="settings-json" style="background:rgba(4,5,12,.7);border:1px solid var(--line);color:var(--text);padding:12px;border-radius:10px;font-family:var(--mono);font-size:11.5px;line-height:1.6;outline:none;min-height:380px;width:100%">' +
      esc(JSON.stringify(data.settings, null, 2)) + '</textarea></div>' +
      '<div class="toolbar">' +
      '<button class="cbtn" id="set-save">SAVE SETTINGS</button>' +
      '<button class="cbtn ghost" id="set-export">EXPORT FULL DATA</button>' +
      '<button class="cbtn ghost" id="set-import">IMPORT FULL DATA</button>' +
      '<button class="cbtn danger" id="set-reset">RESET TO SEED</button>' +
      '<input type="file" id="set-import-file" accept=".json" style="display:none">' +
      '</div>';
    $('#set-save').addEventListener('click', function () {
      try {
        var obj = JSON.parse($('#settings-json').value);
        if (!obj || typeof obj !== 'object') throw new Error('object required');
        data.settings = obj;
        st = obj;
        persist();
        toast('SETTINGS SAVED');
        switchView('settings');
      } catch (e) { toast('JSON 解析失败: ' + e.message, true); }
    });
    $('#set-export').addEventListener('click', exportJson);
    $('#set-import').addEventListener('click', function () { $('#set-import-file').click(); });
    $('#set-import-file').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          if (!obj.anime) throw new Error('bad');
          data = obj;
          st = obj.settings || {};
          persist();
          toast('DATA IMPORTED');
          switchView('settings');
        } catch (err) { toast('INVALID JSON', true); }
      };
      rd.readAsText(f);
    });
    $('#set-reset').addEventListener('click', function () {
      if (!confirm('恢复种子数据？')) return;
      data = JSON.parse(JSON.stringify(window.SEED_DATA));
      st = data.settings;
      S.resetData();
      toast('RESET TO SEED');
      switchView('settings');
    });
  }

  /* ---------- boot ---------- */
  function init() {
    bindSidebar();
    try {
      var v = new URLSearchParams(window.location.search).get('view');
      if (v && VIEWS.indexOf(v) > -1) currentView = v;
    } catch (e) { /* ignore */ }
    initAuth();
    if (window.MALStarfield) {
      var c = document.getElementById('cosmos-canvas');
      if (c) new MALStarfield(c);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
