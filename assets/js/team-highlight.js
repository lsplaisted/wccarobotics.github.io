// Team highlight: click any team number to highlight all their appearances on the page
(function() {
  var TEAM_RE = /\b(\d{4,5})\s+/g;
  var activeTeam = null;

  function setup() {
    var nodes = document.querySelectorAll('.page-content td, .page-content li');
    if (!nodes.length) return;

    var foundAny = false;
    nodes.forEach(function(node) {
      if (TEAM_RE.test(node.textContent)) {
        foundAny = true;
      }
      TEAM_RE.lastIndex = 0;
    });
    if (!foundAny) return;

    nodes.forEach(function(node) {
      wrapTeamRefs(node);
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.team-ref')) {
        clearHighlight();
      }
    });
  }

  function wrapTeamRefs(el) {
    var childNodes = Array.from(el.childNodes);
    childNodes.forEach(function(child) {
      if (child.nodeType === Node.TEXT_NODE) {
        var text = child.textContent;
        if (!TEAM_RE.test(text)) return;
        TEAM_RE.lastIndex = 0;

        var frag = document.createDocumentFragment();
        var lastIndex = 0;
        var match;

        while ((match = TEAM_RE.exec(text)) !== null) {
          var teamNum = match[1];
          var matchStart = match.index;

          if (matchStart > lastIndex) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
          }

          // Team name continues until next team number, pipe/slash separator, or end
          var afterNum = match.index + match[0].length;
          var rest = text.slice(afterNum);
          var nameEnd = rest.search(/\b\d{4,5}\b|[|/]|$/);
          var teamName = rest.slice(0, nameEnd).replace(/[\s,]+$/, '');

          var span = document.createElement('span');
          span.className = 'team-ref';
          span.setAttribute('data-team', teamNum);
          span.textContent = teamNum + ' ' + teamName;
          span.addEventListener('click', onTeamClick);
          frag.appendChild(span);

          lastIndex = afterNum + nameEnd;
          var trailing = text.slice(lastIndex).match(/^[\s,]*/);
          if (trailing) {
            frag.appendChild(document.createTextNode(trailing[0]));
            lastIndex += trailing[0].length;
          }
          TEAM_RE.lastIndex = lastIndex;
        }

        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'SPAN') {
        wrapTeamRefs(child);
      }
    });
  }

  function onTeamClick(e) {
    e.stopPropagation();
    var team = this.getAttribute('data-team');

    if (activeTeam === team) {
      clearHighlight();
      return;
    }

    clearHighlight();
    activeTeam = team;

    document.querySelectorAll('.team-ref[data-team="' + team + '"]').forEach(function(el) {
      el.classList.add('team-highlight');
      var td = el.closest('td');
      if (td) td.classList.add('team-cell-highlight');
    });
  }

  function clearHighlight() {
    activeTeam = null;
    document.querySelectorAll('.team-highlight').forEach(function(el) {
      el.classList.remove('team-highlight');
    });
    document.querySelectorAll('.team-cell-highlight').forEach(function(el) {
      el.classList.remove('team-cell-highlight');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
