/* Brand Diagnosis app logic. Depends on BRAND_DIAG_DATA from data.js */

(function () {
  const DATA = BRAND_DIAG_DATA;
  const CATEGORIES = DATA.categories;
  const GROUPS = DATA.groups;
  const GROUP_ORDER = ['customer', 'strategy', 'equity', 'org', 'activation', 'digital'];
  const TOTAL_ITEMS = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

  const SCALE = [
    { value: 1, label: '全く\n当てはまらない' },
    { value: 2, label: 'あまり\n当てはまらない' },
    { value: 3, label: 'どちらとも\n言えない' },
    { value: 4, label: 'やや\n当てはまる' },
    { value: 5, label: '非常に\n当てはまる' }
  ];

  const state = {
    answers: {},      // key `${catId}#${itemNum}` -> 1-5 or 'na'
    catIndex: 0,
    brandName: ''
  };

  const el = (sel) => document.querySelector(sel);
  const els = (sel) => Array.from(document.querySelectorAll(sel));

  function answerKey(catId, n) { return catId + '#' + n; }

  function answeredCount() {
    return Object.keys(state.answers).length;
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  /* ---------- Intro screen ---------- */

  function initIntro() {
    el('#start-diagnosis-btn').addEventListener('click', () => {
      state.brandName = el('#brand-name-input').value.trim();
      el('#intro-screen').style.display = 'none';
      el('#quiz-screen').style.display = 'block';
      renderCategoryNav();
      renderCategory(0);
      window.scrollTo({ top: el('#quiz-screen').offsetTop - 90, behavior: 'smooth' });
    });
  }

  /* ---------- Category nav ---------- */

  function renderCategoryNav() {
    const nav = el('#cat-nav-list');
    nav.innerHTML = CATEGORIES.map((c, i) => {
      const done = c.items.filter(it => state.answers[answerKey(c.id, it.n)] !== undefined).length;
      const full = done === c.items.length;
      return `
        <button class="cat-nav-item${i === state.catIndex ? ' is-active' : ''}${full ? ' is-done' : ''}" data-index="${i}">
          <span class="cat-nav-num">${i + 1}</span>
          <span class="cat-nav-label">${c.title}</span>
          <span class="cat-nav-count">${done}/${c.items.length}</span>
        </button>`;
    }).join('');
    els('.cat-nav-item').forEach(btn => {
      btn.addEventListener('click', () => renderCategory(parseInt(btn.dataset.index, 10)));
    });
    updateOverallProgress();
  }

  function updateOverallProgress() {
    const done = answeredCount();
    const pct = Math.round((done / TOTAL_ITEMS) * 100);
    el('#overall-progress-fill').style.width = pct + '%';
    el('#overall-progress-text').textContent = `全体の回答状況: ${done} / ${TOTAL_ITEMS} 問（${pct}%）`;
  }

  /* ---------- Question rendering ---------- */

  function renderCategory(index) {
    state.catIndex = index;
    const cat = CATEGORIES[index];
    const group = GROUPS[cat.group];

    el('#cat-title-index').textContent = `分野 ${index + 1} / ${CATEGORIES.length}`;
    el('#cat-title-group').textContent = group.label;
    el('#cat-title-group').style.color = group.color;
    el('#cat-title-main').textContent = cat.title;

    el('#cat-questions').innerHTML = cat.items.map(item => {
      const key = answerKey(cat.id, item.n);
      const current = state.answers[key];
      const scaleHtml = SCALE.map(s => `
          <label class="scale-option${current === s.value ? ' is-selected' : ''}">
            <input type="radio" name="${key}" value="${s.value}" ${current === s.value ? 'checked' : ''}>
            <span class="scale-num">${s.value}</span>
            <span class="scale-label">${s.label.replace('\n', '<br>')}</span>
          </label>`).join('');
      const naSelected = current === 'na';
      return `
        <div class="q-row" data-key="${key}">
          <div class="q-text">
            <span class="q-num">Q${item.n}</span>
            <span>${item.t}</span>
            ${item.note ? `<button type="button" class="q-note-toggle" data-key="${key}"><i data-lucide="info"></i>補足</button>
            <div class="q-note" id="note-${key.replace('#','-')}" hidden>${item.note}</div>` : ''}
          </div>
          <div class="q-scale">
            <div class="scale-row">${scaleHtml}</div>
            <label class="na-option${naSelected ? ' is-selected' : ''}">
              <input type="radio" name="${key}" value="na" ${naSelected ? 'checked' : ''}>
              対象外 / わからない
            </label>
          </div>
        </div>`;
    }).join('');

    // Wire up answer inputs
    els('#cat-questions input[type=radio]').forEach(input => {
      input.addEventListener('change', (e) => {
        const row = e.target.closest('.q-row');
        const key = row.dataset.key;
        state.answers[key] = e.target.value === 'na' ? 'na' : parseInt(e.target.value, 10);
        row.querySelectorAll('.scale-option, .na-option').forEach(o => o.classList.remove('is-selected'));
        e.target.closest('.scale-option, .na-option').classList.add('is-selected');
        renderCategoryNav(); // refresh progress counts (also re-renders active state)
        // renderCategoryNav rebuilds the nav only; restore focus not required
        updateOverallProgress();
      });
    });

    // Wire up note toggles
    els('.q-note-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const note = document.getElementById('note-' + key.replace('#', '-'));
        note.hidden = !note.hidden;
      });
    });

    // Footer nav buttons
    el('#prev-cat-btn').disabled = index === 0;
    el('#next-cat-btn').textContent = index === CATEGORIES.length - 1 ? '診断結果を見る' : '次の分野へ';

    refreshIcons();
    updateOverallProgress();
    document.querySelectorAll('.cat-nav-item').forEach((b, i) => b.classList.toggle('is-active', i === index));

    el('#cat-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initQuizNav() {
    el('#prev-cat-btn').addEventListener('click', () => {
      if (state.catIndex > 0) renderCategory(state.catIndex - 1);
    });
    el('#next-cat-btn').addEventListener('click', () => {
      if (state.catIndex < CATEGORIES.length - 1) {
        renderCategory(state.catIndex + 1);
      } else {
        showResults();
      }
    });
  }

  /* ---------- Scoring ---------- */

  function computeScores() {
    const perCategory = {};
    const perGroup = {};
    GROUP_ORDER.forEach(g => { perGroup[g] = { sum: 0, count: 0 }; });
    let overallSum = 0;
    let overallCount = 0;

    CATEGORIES.forEach(cat => {
      let sum = 0, count = 0;
      cat.items.forEach(item => {
        const v = state.answers[answerKey(cat.id, item.n)];
        if (typeof v === 'number') {
          const normalized = ((v - 1) / 4) * 100; // 1-5 -> 0-100
          sum += normalized;
          count += 1;
          perGroup[cat.group].sum += normalized;
          perGroup[cat.group].count += 1;
          overallSum += normalized;
          overallCount += 1;
        }
      });
      perCategory[cat.id] = count > 0 ? { score: sum / count, count, total: cat.items.length } : { score: null, count: 0, total: cat.items.length };
    });

    const groupScores = {};
    GROUP_ORDER.forEach(g => {
      const bucket = perGroup[g];
      groupScores[g] = bucket.count > 0 ? bucket.sum / bucket.count : null;
    });

    const overallScore = overallCount > 0 ? overallSum / overallCount : null;

    return { perCategory, groupScores, overallScore, answered: overallCount, total: TOTAL_ITEMS };
  }

  function scoreLabel(score) {
    if (score === null) return { text: 'データなし', color: '#94a3b8' };
    if (score >= 85) return { text: '卓越したブランド', color: '#34d399' };
    if (score >= 70) return { text: '強いブランド', color: '#38bdf8' };
    if (score >= 55) return { text: '発展途上のブランド', color: '#d4af37' };
    if (score >= 40) return { text: '弱いブランド', color: '#fb923c' };
    return { text: '危機的な状況', color: '#f87171' };
  }

  /* ---------- Radar chart (hand-drawn SVG) ---------- */

  function buildRadarSVG(groupScores) {
    const size = 440;
    const cx = size / 2, cy = size / 2;
    const maxR = 150;
    const n = GROUP_ORDER.length;
    const angleFor = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

    const pt = (i, r) => {
      const a = angleFor(i);
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };

    // grid rings
    let gridRings = '';
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(frac => {
      const points = GROUP_ORDER.map((_, i) => pt(i, maxR * frac).join(',')).join(' ');
      gridRings += `<polygon points="${points}" class="radar-grid-ring" />`;
    });

    // axis lines
    let axes = '';
    GROUP_ORDER.forEach((_, i) => {
      const [x, y] = pt(i, maxR);
      axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis-line" />`;
    });

    // data polygon
    const dataPoints = GROUP_ORDER.map((g, i) => {
      const score = groupScores[g] || 0;
      return pt(i, maxR * (score / 100));
    });
    const dataPolygon = dataPoints.map(p => p.join(',')).join(' ');

    // labels
    let labels = '';
    GROUP_ORDER.forEach((g, i) => {
      const [x, y] = pt(i, maxR + 42);
      const group = GROUPS[g];
      const score = groupScores[g];
      const anchor = Math.abs(x - cx) < 5 ? 'middle' : (x > cx ? 'start' : 'end');
      labels += `
        <text x="${x}" y="${y - 6}" text-anchor="${anchor}" class="radar-label" fill="${group.color}">${group.short}</text>
        <text x="${x}" y="${y + 14}" text-anchor="${anchor}" class="radar-label-score">${score !== null ? Math.round(score) : '—'}</text>`;
    });

    // dots on data points
    let dots = '';
    GROUP_ORDER.forEach((g, i) => {
      const [x, y] = dataPoints[i];
      dots += `<circle cx="${x}" cy="${y}" r="4" class="radar-dot" />`;
    });

    return `
      <svg viewBox="0 0 ${size} ${size}" class="radar-svg">
        ${gridRings}
        ${axes}
        <polygon points="${dataPolygon}" class="radar-data-polygon" />
        ${dots}
        ${labels}
      </svg>`;
  }

  /* ---------- Results screen ---------- */

  function showResults() {
    const { perCategory, groupScores, overallScore, answered, total } = computeScores();

    el('#quiz-screen').style.display = 'none';
    el('#result-screen').style.display = 'block';

    const nameLabel = state.brandName ? `「${state.brandName}」の` : '';
    el('#result-heading').textContent = `${nameLabel}ブランド診断結果`;

    const overallLbl = scoreLabel(overallScore);
    el('#overall-score-num').textContent = overallScore !== null ? Math.round(overallScore) : '—';
    el('#overall-score-label').textContent = overallLbl.text;
    el('#overall-score-label').style.color = overallLbl.color;

    const completePct = Math.round((answered / total) * 100);
    el('#result-completion').textContent = `回答数: ${answered} / ${total} 問（回答率 ${completePct}%）`;
    el('#result-incomplete-warning').style.display = completePct < 50 ? 'flex' : 'none';

    el('#radar-container').innerHTML = buildRadarSVG(groupScores);

    // Group breakdown bars
    el('#group-breakdown').innerHTML = GROUP_ORDER.map(g => {
      const group = GROUPS[g];
      const score = groupScores[g];
      const lbl = scoreLabel(score);
      const pct = score !== null ? Math.round(score) : 0;
      return `
        <div class="group-bar-row">
          <div class="group-bar-head">
            <span class="group-bar-name" style="color:${group.color}">${group.label}</span>
            <span class="group-bar-score">${score !== null ? Math.round(score) : '—'}<small> / 100</small></span>
          </div>
          <div class="group-bar-track">
            <div class="group-bar-fill" style="width:${pct}%; background:${group.color};"></div>
          </div>
        </div>`;
    }).join('');

    // Category ranking (weakest first)
    const ranked = CATEGORIES
      .map(c => ({ cat: c, ...perCategory[c.id] }))
      .filter(x => x.score !== null)
      .sort((a, b) => a.score - b.score);

    const weakest = ranked.slice(0, 5);
    const strongest = ranked.slice(-5).reverse();

    el('#weak-list').innerHTML = weakest.length ? weakest.map(x => renderCategoryRankRow(x)).join('') : '<p class="muted">回答データが不足しています。</p>';
    el('#strong-list').innerHTML = strongest.length ? strongest.map(x => renderCategoryRankRow(x)).join('') : '<p class="muted">回答データが不足しています。</p>';

    // Full category table
    el('#full-cat-table').innerHTML = CATEGORIES.map(c => {
      const data = perCategory[c.id];
      const group = GROUPS[c.group];
      const score = data.score;
      return `
        <tr>
          <td><span class="dot" style="background:${group.color}"></span>${c.title}</td>
          <td class="muted">${group.short}</td>
          <td>${score !== null ? Math.round(score) : '—'}</td>
          <td class="muted">${data.count}/${data.total}</td>
        </tr>`;
    }).join('');

    refreshIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCategoryRankRow(x) {
    const group = GROUPS[x.cat.group];
    return `
      <div class="rank-row">
        <span class="dot" style="background:${group.color}"></span>
        <span class="rank-title">${x.cat.title}</span>
        <span class="rank-score">${Math.round(x.score)}</span>
      </div>`;
  }

  function initResultActions() {
    el('#retry-btn').addEventListener('click', () => {
      if (!confirm('回答内容をすべてリセットして、最初からやり直しますか？')) return;
      state.answers = {};
      state.catIndex = 0;
      el('#result-screen').style.display = 'none';
      el('#intro-screen').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el('#print-btn').addEventListener('click', () => window.print());
  }

  /* ---------- Boot ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    el('#intro-total-count').textContent = TOTAL_ITEMS;
    el('#intro-cat-count').textContent = CATEGORIES.length;
    initIntro();
    initQuizNav();
    initResultActions();
  });
})();
