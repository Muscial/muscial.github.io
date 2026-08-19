/* MAL friends page logic */
(function () {
  'use strict';
  var S = window.MAL;
  var data = S.loadData();
  var st = S.settings(data);

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (st[key]) el.textContent = st[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-html');
    if (st[key]) el.innerHTML = (key === 'adminEntryLabel' ? S.icon('shield') + ' ' : '') + st[key];
  });
  var backIcon = document.getElementById('back-icon');
  if (backIcon) backIcon.innerHTML = S.icon('back');
  var desc = document.querySelector('.friends-hero p');
  if (desc) desc.textContent = st.friendsDescription || '';

  /* profile */
  var prof = data.profile || {};
  var profileEl = document.getElementById('friends-profile');
  function avatarHtml(src, cls, name, fbCls) {
    return '<div class="' + cls + '">' +
      (src ? '<img src="' + S.escapeHtml(src) + '" alt="" loading="lazy">' : '') +
      '<span class="' + (fbCls || 'cover-fallback') + '" style="display:' + (src ? 'none' : 'grid') + '">' +
      S.avatarInitial(name) + '</span></div>';
  }
  if (profileEl) {
    profileEl.innerHTML =
      avatarHtml(prof.avatar, 'friends-avatar', prof.displayName) +
      '<div class="friends-profile-info">' +
        '<h2>' + S.escapeHtml(prof.displayName || '') + '</h2>' +
        '<div class="fp-handle">' + S.escapeHtml(prof.handle || '') + '</div>' +
        '<p class="fp-intro">' + S.escapeHtml(prof.introduction || '') + '</p>' +
        '<div class="fp-meta">' +
          '<span><b>' + S.escapeHtml(st.friendsLocationLabel || 'LOCATION') + '</b>' + S.escapeHtml(prof.location || '—') + '</span>' +
          '<span><b>' + S.escapeHtml(st.friendsWebsiteLabel || 'PERSONAL LINK') + '</b><a href="' + S.escapeHtml(prof.websiteUrl || '#') + '" target="_blank" rel="noopener">' + S.escapeHtml(prof.websiteLabel || prof.websiteUrl || '') + '</a></span>' +
          (prof.contactValue ? '<span><b>' + S.escapeHtml(prof.contactLabel || st.friendsContactLabel || 'CONTACT') + '</b>' + S.escapeHtml(prof.contactValue) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<span class="friends-signal"><i></i>' + S.escapeHtml(st.friendsSignalLabel || 'SIGNAL / ONLINE') + '</span>';
    S.setupCoverFallbacks(profileEl);
  }

  /* friends grid */
  var friends = (data.friends || []).filter(function (f) { return f.visible !== false; });
  var grid = document.getElementById('friends-grid');
  if (grid) {
    if (!friends.length) {
      grid.innerHTML = '<div class="no-results"><h4>' + S.escapeHtml(st.friendsEmptyTitle || 'NO LINKED SIGNALS') + '</h4>' +
        '<p>' + S.escapeHtml(st.friendsEmptyDescription || '') + '</p></div>';
    } else {
      grid.innerHTML = friends.map(function (f, i) {
        return '<a class="friend-card" href="' + S.escapeHtml(f.url || '#') + '" target="_blank" rel="noopener">' +
          '<span class="fc-index">0' + (i + 1) + '</span>' +
          avatarHtml(f.avatar, 'fc-avatar', f.name) +
          '<div class="fc-info">' +
            '<div class="fc-id">' + S.escapeHtml(st.friendsLinkIdLabel || 'LINK ID') + ' / ' + S.escapeHtml(f.id || '') + '</div>' +
            '<div class="fc-name">' + S.escapeHtml(f.name || '') + '</div>' +
            '<div class="fc-desc">' + S.escapeHtml(f.description || '') + '</div>' +
            '<span class="fc-link">' + S.escapeHtml(st.friendsOpenLinkLabel || 'OPEN LINK') + ' ' + S.icon('ext') + '</span>' +
          '</div>' +
          '</a>';
      }).join('');
    }
    S.setupCoverFallbacks(grid);
  }

  S.applyFooter(data);
  if (window.MALStarfield) {
    var c = document.getElementById('cosmos-canvas');
    if (c) new MALStarfield(c);
  }
  S.initReveal();
})();
