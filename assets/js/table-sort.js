// Sortable tables: click any <th> to sort. Works on all tables inside .page-content.
// Sorts numerically when possible, handles W-L-T records, dashes, and blanks.
(function () {
  function setup() {
    document.querySelectorAll('.page-content table').forEach(function (table) {
      var headers = table.querySelectorAll('thead th, tr:first-child th');
      if (!headers.length) return;

      headers.forEach(function (th, colIndex) {
        th.style.cursor = 'pointer';
        th.setAttribute('title', 'Click to sort');
        th.addEventListener('click', function () {
          sortTable(table, colIndex, th);
        });
      });
    });
  }

  function parseWLT(text) {
    // Parse "W-L-T" record → win percentage, with tiebreak on total games
    var m = text.match(/^(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
    if (!m) return null;
    var w = parseInt(m[1], 10);
    var l = parseInt(m[2], 10);
    var t = parseInt(m[3], 10);
    var total = w + l + t;
    if (total === 0) return { pct: 0, total: 0 };
    return { pct: w / total, total: total };
  }

  function sortValue(text) {
    text = text.replace(/\*/g, '').trim();

    // Empty or dash → sort last
    if (!text || text === '—' || text === '-') return { v: -Infinity, type: 'empty' };

    // W-L-T record
    var wlt = parseWLT(text);
    if (wlt) return { v: wlt.pct, total: wlt.total, type: 'wlt' };

    // Percentage like "60%" or "9/15 (60%)"
    var pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (pctMatch) return { v: parseFloat(pctMatch[1]), type: 'number' };

    // Approximate number like "~6 pts" or "48.5"
    var numMatch = text.match(/~?\s*([\d.]+)/);
    if (numMatch) return { v: parseFloat(numMatch[1]), type: 'number' };

    // Plain text
    return { v: text.toLowerCase(), type: 'text' };
  }

  function compareValues(a, b, descending) {
    // Empties always sort last regardless of direction
    if (a.type === 'empty' && b.type === 'empty') return 0;
    if (a.type === 'empty') return 1;
    if (b.type === 'empty') return -1;

    var dir = descending ? -1 : 1;

    if (a.type === 'wlt' && b.type === 'wlt') {
      var diff = a.v - b.v;
      if (diff !== 0) return diff * dir;
      // Tiebreak: more games played first
      return (a.total - b.total) * dir;
    }

    if (a.type === 'text' && b.type === 'text') {
      return a.v < b.v ? -dir : a.v > b.v ? dir : 0;
    }

    // Numeric comparison
    return (a.v - b.v) * dir;
  }

  function sortTable(table, colIndex, th) {
    var tbody = table.querySelector('tbody') || table;
    var headerRow = table.querySelector('thead tr') || table.querySelector('tr:first-child');

    var rows = Array.from(tbody.querySelectorAll('tr')).filter(function (row) {
      return row !== headerRow && !row.querySelector('th');
    });

    // Determine sort direction
    var currentDir = th.getAttribute('data-sort-dir');
    var descending = currentDir !== 'desc';

    // Clear other headers
    var allTh = headerRow.querySelectorAll('th');
    allTh.forEach(function (h) {
      h.removeAttribute('data-sort-dir');
      h.classList.remove('sort-asc', 'sort-desc');
    });

    th.setAttribute('data-sort-dir', descending ? 'desc' : 'asc');
    th.classList.add(descending ? 'sort-desc' : 'sort-asc');

    rows.sort(function (rowA, rowB) {
      var cellA = rowA.querySelectorAll('td')[colIndex];
      var cellB = rowB.querySelectorAll('td')[colIndex];
      var textA = cellA ? cellA.textContent : '';
      var textB = cellB ? cellB.textContent : '';
      return compareValues(sortValue(textA), sortValue(textB), descending);
    });

    rows.forEach(function (row) {
      tbody.appendChild(row);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
