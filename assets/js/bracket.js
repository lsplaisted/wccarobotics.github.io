// Bracket connectors: draws elbow lines between match boxes in a .bracket-tree.
// Connections are declared on the tree via data-connect='[["fromId","toId","top|bottom"], ...]'.
// Each match box has a data-box="id". A connection draws a line from the right edge of the
// "from" box to the left edge of the "to" box, entering at its top or bottom team slot.
(function () {
  function draw(tree) {
    var connections;
    try {
      connections = JSON.parse(tree.getAttribute('data-connect') || '[]');
    } catch (e) {
      return;
    }

    var svg = tree.querySelector('svg.bracket-lines');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'bracket-lines');
      tree.insertBefore(svg, tree.firstChild);
    }
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var cont = tree.getBoundingClientRect();
    svg.setAttribute('width', cont.width);
    svg.setAttribute('height', cont.height);
    svg.setAttribute('viewBox', '0 0 ' + cont.width + ' ' + cont.height);

    connections.forEach(function (c) {
      var from = tree.querySelector('[data-box="' + c[0] + '"]');
      var to = tree.querySelector('[data-box="' + c[1] + '"]');
      if (!from || !to) return;
      var f = from.getBoundingClientRect();
      var t = to.getBoundingClientRect();

      var sx = f.right - cont.left;
      var sy = f.top - cont.top + f.height / 2;
      var tx = t.left - cont.left;
      var slot = c[2] === 'bottom' ? 0.72 : c[2] === 'top' ? 0.28 : 0.5;
      var ty = t.top - cont.top + t.height * slot;
      var bend = typeof c[3] === 'number' ? c[3] : 0.5;
      var midx = sx + (tx - sx) * bend;

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M ' + sx + ' ' + sy + ' H ' + midx + ' V ' + ty + ' H ' + tx);
      path.setAttribute('class', 'bracket-line');
      svg.appendChild(path);

      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', tx);
      dot.setAttribute('cy', ty);
      dot.setAttribute('r', 3);
      dot.setAttribute('class', 'bracket-line-dot');
      svg.appendChild(dot);
    });
  }

  function init() {
    var trees = document.querySelectorAll('.bracket-tree');
    if (!trees.length) return;
    function redraw() {
      trees.forEach(draw);
    }
    redraw();
    window.addEventListener('resize', redraw);
    // Redraw after fonts/layout settle.
    setTimeout(redraw, 200);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
