/* MAL compact markdown renderer (original implementation) */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* inline: code, bold, italic, strike, links, images, autolink */
  function renderInline(text) {
    var out = '';
    var i = 0;
    var buf = '';
    function flush() {
      if (buf) { out += escapeHtml(buf); buf = ''; }
    }
    while (i < text.length) {
      var c = text[i];
      /* inline code */
      if (c === '`') {
        var end = text.indexOf('`', i + 1);
        if (end > -1) {
          flush();
          out += '<code>' + escapeHtml(text.slice(i + 1, end)) + '</code>';
          i = end + 1; continue;
        }
      }
      /* image ![alt](url) */
      if (c === '!' && text[i + 1] === '[') {
        var ci = text.indexOf('](', i + 2);
        if (ci > -1) {
          var alt = text.slice(i + 2, ci);
          var ce = text.indexOf(')', ci + 2);
          if (ce > -1) {
            flush();
            out += '<img src="' + escapeHtml(text.slice(ci + 2, ce)) + '" alt="' + escapeHtml(alt) + '" loading="lazy">';
            i = ce + 1; continue;
          }
        }
      }
      /* link [text](url) */
      if (c === '[') {
        var li = text.indexOf('](', i + 1);
        if (li > -1) {
          var lt = text.slice(i + 1, li);
          var le = text.indexOf(')', li + 2);
          if (le > -1) {
            var url = text.slice(li + 2, le);
            flush();
            out += '<a href="' + escapeHtml(url) + '"' + (url.startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' + renderInline(lt) + '</a>';
            i = le + 1; continue;
          }
        }
      }
      /* bold */
      if (c === '*' && text[i + 1] === '*') {
        var be = text.indexOf('**', i + 2);
        if (be > -1) { flush(); out += '<strong>' + renderInline(text.slice(i + 2, be)) + '</strong>'; i = be + 2; continue; }
      }
      if (c === '_' && text[i + 1] === '_') {
        var ue = text.indexOf('__', i + 2);
        if (ue > -1) { flush(); out += '<strong>' + renderInline(text.slice(i + 2, ue)) + '</strong>'; i = ue + 2; continue; }
      }
      /* italic */
      if (c === '*') {
        var ie = text.indexOf('*', i + 1);
        if (ie > -1) { flush(); out += '<em>' + renderInline(text.slice(i + 1, ie)) + '</em>'; i = ie + 1; continue; }
      }
      /* strike */
      if (c === '~' && text[i + 1] === '~') {
        var se = text.indexOf('~~', i + 2);
        if (se > -1) { flush(); out += '<del>' + renderInline(text.slice(i + 2, se)) + '</del>'; i = se + 2; continue; }
      }
      buf += c; i++;
    }
    flush();
    return out;
  }

  var TOK_H = /^(#{1,6})\s+(.*)$/;
  var TOK_HR = /^\s*(-{3,}|\*{3,})\s*$/;
  var TOK_QUOTE = /^>\s?(.*)$/;
  var TOK_UL = /^[-*+]\s+(.*)$/;
  var TOK_OL = /^(\d+)[.)]\s+(.*)$/;
  var TOK_TABLE = /^\|(.+)\|$/;

  function renderBlock(lines) {
    var html = '';
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var m;

      /* fenced code */
      if (/^```/.test(line)) {
        var lang = line.slice(3).trim();
        var buf = [];
        var j = i + 1;
        while (j < lines.length && !/^```/.test(lines[j])) { buf.push(lines[j]); j++; }
        html += '<pre><code' + (lang ? ' class="lang-' + escapeHtml(lang) + '"' : '') + '>' + escapeHtml(buf.join('\n')) + '</code></pre>\n';
        i = j + 1; continue;
      }

      /* blank */
      if (/^\s*$/.test(line)) { i++; continue; }

      /* heading */
      if ((m = line.match(TOK_H))) {
        var lvl = m[1].length;
        html += '<h' + lvl + '>' + renderInline(m[2].trim()) + '</h' + lvl + '>\n';
        i++; continue;
      }

      /* hr */
      if (TOK_HR.test(line)) { html += '<hr>\n'; i++; continue; }

      /* blockquote */
      if (TOK_QUOTE.test(line)) {
        var qb = [];
        while (i < lines.length && (m = lines[i].match(TOK_QUOTE))) { qb.push(m[1]); i++; }
        html += '<blockquote>' + renderBlock(qb) + '</blockquote>\n';
        continue;
      }

      /* table */
      if ((m = line.match(TOK_TABLE))) {
        var rows = [];
        while (i < lines.length && (m = lines[i].match(TOK_TABLE))) {
          var cells = m[1].split('|').map(function (s) { return s.trim(); });
          rows.push(cells);
          i++;
        }
        if (rows.length >= 2 && rows[1].every(function (s) { return /^:?-{1,}:?$/.test(s); })) {
          var t = '<table>';
          t += '<thead><tr>' + rows[0].map(function (c) { return '<th>' + renderInline(c) + '</th>'; }).join('') + '</tr></thead>';
          t += '<tbody>' + rows.slice(2).map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + renderInline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table>\n';
          html += t;
        } else {
          html += '<p>' + renderInline(rows.map(function (r) { return '| ' + r.join(' | ') + ' |'; }).join('<br>')) + '</p>\n';
        }
        continue;
      }

      /* unordered list */
      if ((m = line.match(TOK_UL))) {
        var items = [];
        var depth = 0;
        var levels = [m[1]];
        items.push({ d: 0, t: m[1] });
        i++;
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push({ d: 1, t: lines[i].replace(/^\s*[-*+]\s+/, '') }); i++; }
        html += '<ul>';
        items.forEach(function (it) {
          html += '<li>' + renderInline(it.t) + '</li>';
        });
        html += '</ul>\n';
        continue;
      }

      /* ordered list */
      if ((m = line.match(TOK_OL))) {
        var ol = [];
        ol.push(m[2]);
        i++;
        while (i < lines.length && (m = lines[i].match(TOK_OL))) { ol.push(m[2]); i++; }
        html += '<ol>';
        ol.forEach(function (t) { html += '<li>' + renderInline(t) + '</li>'; });
        html += '</ol>\n';
        continue;
      }

      /* paragraph */
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !/^```/.test(lines[i]) && !TOK_HR.test(lines[i]) && !TOK_QUOTE.test(lines[i]) && !TOK_UL.test(lines[i]) && !TOK_OL.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      html += '<p>' + renderInline(para.join(' ')) + '</p>\n';
    }
    return html;
  }

  global.MAL.renderMarkdown = function (md) {
    if (md == null) return '';
    var lines = String(md).replace(/\r\n?/g, '\n').split('\n');
    return renderBlock(lines);
  };
})(window);
