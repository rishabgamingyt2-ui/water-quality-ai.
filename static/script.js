/* ============================================================
   Aqueduct — vanilla JS
   Nav scroll state, interactive analysis workspace, results
   dashboard rendering, and misc dynamic content.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Sticky nav background on scroll ---------- */
  var nav = document.getElementById('siteNav');
  function onScroll() {
    if (window.scrollY > 8) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Footer year ---------- */
  var footerCopy = document.getElementById('footerCopy');
  if (footerCopy) {
    footerCopy.textContent = '\u00A9 ' + new Date().getFullYear() + ' Aqueduct Intelligence, Inc.';
  }

  /* ============================================================
     ANALYSIS WORKSPACE
     ============================================================ */
  var PARAMS = [
    { key: 'ph', label: 'pH', unit: '', min: 0, max: 14, step: 0.1, ideal: [6.5, 8.5], def: 7.2 },
    { key: 'hardness', label: 'Hardness', unit: 'mg/L', min: 0, max: 400, step: 1, ideal: [60, 180], def: 165 },
    { key: 'solids', label: 'Solids', unit: 'ppm', min: 0, max: 60000, step: 100, ideal: [0, 500], def: 21000 },
    { key: 'chloramines', label: 'Chloramines', unit: 'ppm', min: 0, max: 14, step: 0.1, ideal: [0, 4], def: 7.1 },
    { key: 'sulfate', label: 'Sulfate', unit: 'mg/L', min: 0, max: 500, step: 1, ideal: [0, 250], def: 312 },
    { key: 'conductivity', label: 'Conductivity', unit: '\u03BCS/cm', min: 0, max: 800, step: 1, ideal: [0, 400], def: 421 },
    { key: 'carbon', label: 'Organic carbon', unit: 'ppm', min: 0, max: 30, step: 0.1, ideal: [0, 4], def: 14.2 },
    { key: 'turbidity', label: 'Turbidity', unit: 'NTU', min: 0, max: 10, step: 0.1, ideal: [0, 1], def: 0.9 },
  ];

  var values = {};
  PARAMS.forEach(function (p) {
    values[p.key] = p.def;
  });

  function scoreParam(p, value) {
    var lo = p.ideal[0];
    var hi = p.ideal[1];
    if (value >= lo && value <= hi) return 1;
    var span = p.max - p.min;
    var dist = value < lo ? lo - value : value - hi;
    return Math.max(0, 1 - (dist / span) * 3);
  }

  var inputsRoot = document.getElementById('wsInputs');
  if (!inputsRoot) return;

  function paramById(key) {
    for (var i = 0; i < PARAMS.length; i++) {
      if (PARAMS[i].key === key) return PARAMS[i];
    }
    return null;
  }
/*
  // Build slider rows
  PARAMS.forEach(function (p) {
    var field = document.createElement('div');

    var head = document.createElement('div');
    head.className = 'param-head';

    var label = document.createElement('label');
    label.className = 'param-label';
    label.setAttribute('for', p.key);
    label.textContent = p.label;

    var valueWrap = document.createElement('span');
    valueWrap.className = 'param-value';
    var valueText = document.createElement('span');
    valueText.id = 'val-' + p.key;
    valueText.textContent = String(p.def);
    valueWrap.appendChild(valueText);
    if (p.unit) {
      var unit = document.createElement('span');
      unit.className = 'param-unit';
      unit.textContent = p.unit;
      valueWrap.appendChild(unit);
    }

    head.appendChild(label);
    head.appendChild(valueWrap);

    var range = document.createElement('input');
    range.className = 'param-range';
    range.id = p.key;
    range.type = 'range';
    range.min = String(p.min);
    range.max = String(p.max);
    range.step = String(p.step);
    range.value = String(p.def);

    range.addEventListener('input', function () {
      values[p.key] = Number(range.value);
      valueText.textContent = String(range.value);
      updateRangeFill(p, range);
      renderVerdict();
    });

    field.appendChild(head);
    field.appendChild(range);
    inputsRoot.appendChild(field);

    updateRangeFill(p, range);
  });
*/Z


  function updateRangeFill(p, range) {
    var value = Number(range.value);
    var s = scoreParam(p, value);
    var pct = ((value - p.min) / (p.max - p.min)) * 100;
    var color = s < 0.6 ? 'var(--primary)' : 'var(--foreground)';
    range.style.background =
      'linear-gradient(to right, ' + color + ' ' + pct + '%, var(--input) ' + pct + '%)';
  }

  var confidenceValue = document.getElementById('confidenceValue');
  var confidenceBar = document.getElementById('confidenceBar');
  var verdictPill = document.getElementById('verdictPill');
  var verdictPillText = document.getElementById('verdictPillText');
  var flaggedContainer = document.getElementById('flaggedContainer');

  function renderVerdict() {
    var total = 0;
    var flagged = [];
    PARAMS.forEach(function (p) {
      var s = scoreParam(p, values[p.key]);
      total += s;
      if (s < 0.6) flagged.push(p.label);
    });
    var avg = total / PARAMS.length;
    var confidence = Math.round(avg * 100);
    var potable = avg >= 0.62;

    confidenceValue.textContent = String(confidence);
    confidenceBar.style.width = confidence + '%';

    if (potable) {
      verdictPill.classList.remove('not-potable');
      verdictPillText.textContent = 'Safe';
    } else {
      verdictPill.classList.add('not-potable');
      verdictPillText.textContent = 'Not potable';
    }

    // Flagged signals
    flaggedContainer.innerHTML = '';
    if (flagged.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'flagged-empty';
      empty.textContent = 'All parameters within recommended thresholds.';
      flaggedContainer.appendChild(empty);
    } else {
      var list = document.createElement('ul');
      list.className = 'flagged-list';
      flagged.forEach(function (f) {
        var li = document.createElement('li');
        li.className = 'flagged-item';

        var dot = document.createElement('span');
        dot.className = 'dot-primary-sm';

        var name = document.createTextNode(f + ' ');

        var note = document.createElement('span');
        note.className = 'muted';
        note.textContent = 'exceeds safe range';

        li.appendChild(dot);
        li.appendChild(name);
        li.appendChild(note);
        list.appendChild(li);
      });
      flaggedContainer.appendChild(list);
    }
  }

  renderVerdict();

  // Reset
  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      PARAMS.forEach(function (p) {
        values[p.key] = p.def;
        var range = document.getElementById(p.key);
        var valueText = document.getElementById('val-' + p.key);
        if (range) {
          range.value = String(p.def);
          updateRangeFill(p, range);
        }
        if (valueText) valueText.textContent = String(p.def);
      });
      renderVerdict();
    });
  }

  /* ============================================================
     RESULTS DASHBOARD
     ============================================================ */
  var contributions = [
    { label: 'Sulfate', weight: 0.82, tone: 'warn' },
    { label: 'Chloramines', weight: 0.71, tone: 'warn' },
    { label: 'pH', weight: 0.44, tone: 'ok' },
    { label: 'Turbidity', weight: 0.31, tone: 'ok' },
    { label: 'Conductivity', weight: 0.28, tone: 'ok' },
    { label: 'Hardness', weight: 0.19, tone: 'ok' },
  ];

  var contribList = document.getElementById('contribList');
  if (contribList) {
    contributions.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'contrib-row';

      var label = document.createElement('span');
      label.className = 'contrib-label';
      label.textContent = c.label;

      var track = document.createElement('div');
      track.className = 'contrib-track';
      var fill = document.createElement('div');
      fill.className = 'contrib-fill ' + (c.tone === 'warn' ? 'warn' : 'ok');
      fill.style.width = c.weight * 100 + '%';
      track.appendChild(fill);

      var weight = document.createElement('span');
      weight.className = 'contrib-weight';
      weight.textContent = c.weight.toFixed(2);

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(weight);
      contribList.appendChild(row);
    });
  }

  /* ---------- Confidence trend polyline ---------- */
  var trend = [58, 61, 60, 67, 72, 70, 76, 81, 79, 86, 90, 94];
  var trendLine = document.getElementById('trendLine');
  if (trendLine) {
    var max = Math.max.apply(null, trend);
    var min = Math.min.apply(null, trend);
    var points = trend
      .map(function (v, i) {
        var x = (i / (trend.length - 1)) * 100;
        var y = 100 - ((v - min) / (max - min)) * 100;
        return x + ',' + y;
      })
      .join(' ');
    trendLine.setAttribute('points', points);
  }
})();
const form = document.getElementById("predictionForm");

if(form){
    form.addEventListener("submit",function(){
        const btn=form.querySelector('button[type="submit"]');
        btn.disabled=true;
        btn.innerHTML="Analyzing...";
    });
}
document.querySelectorAll('input[type="number"]').forEach(input=>{
    input.addEventListener("input",function(){
        if(this.value<0){
            this.value=0;
        }
    });
});
const resetBtn=document.getElementById("resetBtn");

if(resetBtn){
    resetBtn.addEventListener("click",()=>{
        document.getElementById("predictionForm").reset();
        window.location.href="/";
    });
}