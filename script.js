(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* =========================================================
     1. NEURAL NET — hero canvas signature
     ========================================================= */
  const net = (() => {
    const cvs = $('#net');
    if (!cvs) return { start(){}, resize(){}, vis(){}, page(){} };
    const ctx = cvs.getContext('2d');
    const VIR = ['#7c4dbe','#3f7fb0','#1f9e8f','#54c469','#a7e34d'];
    const FWD = '#54c469', BACK = '#f5e15a';
    let W = 0, H = 0, DPR = 1;
    let nodes = [], edges = [], signals = [];
    let T = 0, last = 0, raf = 0, running = false;
    let heroVis = true, pageVis = true;
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    let lastFwd = 0, lastBack = 0;

    function layout() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = cvs.getBoundingClientRect();
      W = r.width; H = r.height || innerHeight;
      cvs.width = W * DPR; cvs.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const counts = W < 680 ? [3, 5, 5, 3] : [4, 6, 7, 5, 4];
      nodes = []; edges = [];
      const padX = W * 0.07, usable = W - padX * 2;
      const colGap = usable / (counts.length - 1);
      counts.forEach((c, li) => {
        const x = padX + colGap * li;
        const colH = H * 0.66, top = (H - colH) / 2, gap = colH / (c + 1);
        for (let i = 0; i < c; i++) {
          nodes.push({ x, y: top + gap * (i + 1), layer: li,
            phase: Math.random() * Math.PI * 2, amp: 4 + Math.random() * 7,
            r: 2 + Math.random() * 1.4, act: 0,
            color: VIR[Math.min(li, VIR.length - 1)], out: [], inn: [] });
        }
      });
      let off = 0;
      for (let li = 0; li < counts.length - 1; li++) {
        const a0 = off, a1 = off + counts[li], b1 = a1 + counts[li + 1];
        for (let a = a0; a < a1; a++) for (let b = a1; b < b1; b++) {
          if (W < 680 && Math.random() < 0.28) continue;
          edges.push({ a, b });
        }
        off += counts[li];
      }
      nodes.forEach(n => { n.out = []; n.inn = []; });
      edges.forEach((e, ei) => { nodes[e.a].out.push(ei); nodes[e.b].inn.push(ei); });
      signals = [];
    }

    const px = (n) => n.x + mx * 16;
    const py = (n) => n.y + (reduce ? 0 : Math.sin(T * 0.0011 + n.phase) * n.amp) + my * 12;

    function spawnForward() {
      const first = nodes.filter(n => n.layer === 0);
      first.forEach(n => {
        n.act = 1;
        n.out.forEach(ei => {
          if (Math.random() < 0.75 && signals.length < 90)
            signals.push({ ei, t: 0, sp: 0.45 + Math.random() * 0.35, color: FWD, dir: 1, gen: 0 });
        });
      });
    }
    function spawnBack() {
      const lastLayer = Math.max(...nodes.map(n => n.layer));
      nodes.filter(n => n.layer === lastLayer).forEach(n => {
        if (Math.random() < 0.6) {
          n.act = 1;
          n.inn.forEach(ei => {
            if (Math.random() < 0.5 && signals.length < 90)
              signals.push({ ei, t: 0, sp: 0.5 + Math.random() * 0.3, color: BACK, dir: -1, gen: 0 });
          });
        }
      });
    }

    function step(dt) {
      const lastLayer = Math.max(...nodes.map(n => n.layer));
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.t += s.sp * dt;
        if (s.t >= 1) {
          const e = edges[s.ei];
          const target = s.dir === 1 ? nodes[e.b] : nodes[e.a];
          target.act = 1;
          // propagate
          if (s.dir === 1 && target.layer < lastLayer && s.gen < 4) {
            target.out.forEach(ei => {
              if (Math.random() < 0.6 && signals.length < 90)
                signals.push({ ei, t: 0, sp: s.sp * (0.9 + Math.random() * 0.2), color: FWD, dir: 1, gen: s.gen + 1 });
            });
          } else if (s.dir === -1 && target.layer > 0 && s.gen < 4) {
            target.inn.forEach(ei => {
              if (Math.random() < 0.5 && signals.length < 90)
                signals.push({ ei, t: 0, sp: s.sp * (0.9 + Math.random() * 0.2), color: BACK, dir: -1, gen: s.gen + 1 });
            });
          }
          signals.splice(i, 1);
        }
      }
      nodes.forEach(n => { n.act *= 0.93; });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // edges
      ctx.lineWidth = 1;
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const boost = Math.max(a.act, b.act);
        ctx.strokeStyle = `rgba(124,148,190,${0.05 + boost * 0.22})`;
        ctx.beginPath();
        ctx.moveTo(px(a), py(a));
        ctx.lineTo(px(b), py(b));
        ctx.stroke();
      });
      // nodes
      nodes.forEach(n => {
        const x = px(n), y = py(n);
        if (n.act > 0.04) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(31,158,143,${n.act * 0.28})`;
          ctx.arc(x, y, n.r + 6 + n.act * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = n.act > 0.1 ? '#dffaf2' : n.color;
        ctx.globalAlpha = 0.55 + n.act * 0.45;
        ctx.arc(x, y, n.r + n.act * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // signals
      signals.forEach(s => {
        const e = edges[s.ei];
        const from = s.dir === 1 ? nodes[e.a] : nodes[e.b];
        const to   = s.dir === 1 ? nodes[e.b] : nodes[e.a];
        const x = px(from) + (px(to) - px(from)) * s.t;
        const y = py(from) + (py(to) - py(from)) * s.t;
        const tx = px(from) + (px(to) - px(from)) * Math.max(0, s.t - 0.14);
        const ty = py(from) + (py(to) - py(from)) * Math.max(0, s.t - 0.14);
        ctx.strokeStyle = s.color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.fillStyle = s.color;
        ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      });
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!pageVis || !heroVis) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      T = now;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      if (now - lastFwd > 1500) { lastFwd = now; spawnForward(); }
      if (now - lastBack > 5200) { lastBack = now; spawnBack(); }
      step(dt); draw();
    }

    return {
      start() {
        layout();
        cvs.classList.add('on');
        if (reduce) { draw(); return; }   // static snapshot only
        if (!running) { running = true; last = performance.now(); spawnForward(); requestAnimationFrame(frame); }
      },
      resize() { layout(); if (reduce) draw(); },
      vis(v) { heroVis = v; },
      page(v) { pageVis = v; },
      pointer(x, y) { tmx = (x / innerWidth - 0.5) * 2; tmy = -(y / innerHeight - 0.5) * 2; }
    };
  })();

  /* =========================================================
     2. PROJECTS — data + tabbed render
     ========================================================= */
  const projects = [
    // shipped (javascript / web)
    { cat:'js', status:'shipped', title:'NIP.SYS v2', icon:'[ os ]',
      ru:'Прошлая версия портфолио в стиле ОС. Сайдбар, GitHub-статистика.',
      en:'Previous OS-style portfolio. Sidebar, GitHub stats.',
      tags:['HTML','CSS','JS'], link:'https://chrisredfield48.github.io/nip.sys-v.02/' },
    { cat:'js', status:'shipped', title:'Projects Hub', icon:'[ ui ]',
      ru:'Витрина JS-проектов с динамическими карточками.',
      en:'JS project showcase with dynamic cards.',
      tags:['HTML','CSS','JS'], link:'https://chrisredfield48.github.io/Projects/' },
    { cat:'js', status:'shipped', title:'Zodiac Calculator', icon:'[ fn ]',
      ru:'Определение знака зодиака по дате рождения.',
      en:'Zodiac sign by birth date.',
      tags:['JavaScript'], link:'https://chrisredfield48.github.io/zodiac/' },
    { cat:'js', status:'shipped', title:'Birthday Search', icon:'[ fn ]',
      ru:'Поиск дней рождения жильцов по имени.',
      en:'Search residents by name and birthday.',
      tags:['JavaScript'], link:'https://chrisredfield48.github.io/voda/' },
    { cat:'js', status:'shipped', title:'Graphic Designer', icon:'[ ux ]',
      ru:'Лендинг дизайнера. Верстка, UI-компоненты, адаптив.',
      en:'Designer landing page. Layout, UI components, responsive.',
      tags:['HTML','CSS'], link:'https://chrisredfield48.github.io/graphic-designer/' },
    { cat:'js', status:'shipped', title:'Python Path', icon:'[ doc ]',
      ru:'Страница прогресса изучения Python. Roadmap.',
      en:'Python learning progress page. Roadmap.',
      tags:['HTML','CSS'], link:'https://chrisredfield48.github.io/python/' },

    // python — in development placeholders
    { cat:'py', status:'dev', title:'Neural Net from Scratch', icon:'[ wip ]',
      ru:'Полносвязная сеть на чистом NumPy: прямой проход, backprop, MNIST. Чтобы понять, как оно работает изнутри.',
      en:'A fully-connected net in pure NumPy: forward pass, backprop, MNIST. To understand how it works under the hood.',
      tags:['Python','NumPy'] },
    { cat:'py', status:'dev', title:'SOCKS5 Proxy', icon:'[ wip ]',
      ru:'Свой прокси на asyncio для маршрутизации трафика через российский IP. VPS на Ubuntu.',
      en:'A custom asyncio proxy to route traffic through a Russian IP. Ubuntu VPS.',
      tags:['Python','asyncio'] },
    { cat:'py', status:'plan', title:'Image Classifier', icon:'[ soon ]',
      ru:'CNN на PyTorch для классификации изображений. Обучение, аугментации, метрики.',
      en:'A PyTorch CNN for image classification. Training, augmentation, metrics.',
      tags:['Python','PyTorch','CNN'] },
    { cat:'py', status:'plan', title:'Telegram ML Bot', icon:'[ soon ]',
      ru:'Бот на aiogram, который дёргает обученную модель и отвечает в чат.',
      en:'An aiogram bot that calls a trained model and replies in chat.',
      tags:['Python','aiogram'] },
    { cat:'py', status:'plan', title:'Data Viz Lab', icon:'[ soon ]',
      ru:'Разбор датасетов через Pandas и Matplotlib: чистка, графики, выводы.',
      en:'Exploring datasets with Pandas and Matplotlib: cleaning, plots, takeaways.',
      tags:['Python','Pandas'] }
  ];

  const STATUS = {
    shipped: { cls:'shipped', ru:'Задеплоено', en:'Shipped' },
    dev:     { cls:'dev',     ru:'В разработке', en:'In dev' },
    plan:    { cls:'plan',    ru:'В планах', en:'Planned' }
  };

  function projectCard(p) {
    const st = STATUS[p.status];
    const tags = p.tags.map(t => `<span class="ptag">${esc(t)}</span>`).join('');
    const link = p.link
      ? `<a class="plink" href="${p.link}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.title)} — open"><span class="ru">Открыть</span><span class="en">Open</span> <span aria-hidden="true">→</span></a>`
      : `<span class="plink disabled"><span class="ru">Скоро</span><span class="en">Soon</span> <span aria-hidden="true">▢</span></span>`;
    return `
      <article class="pcard ${p.status === 'shipped' ? '' : 'dev'}" data-cat="${p.cat}">
        <div class="pcard-top">
          <span class="ptag-status ${st.cls}"><span class="ru">${st.ru}</span><span class="en">${st.en}</span></span>
          <span class="pcard-icon">${esc(p.icon)}</span>
        </div>
        <div class="pcard-body">
          <h3 class="pcard-title">${esc(p.title)}</h3>
          <p class="pcard-desc ru">${esc(p.ru)}</p>
          <p class="pcard-desc en">${esc(p.en)}</p>
        </div>
        <div class="pcard-foot">
          <div class="ptags">${tags}</div>
          ${link}
        </div>
      </article>`;
  }

  const pgrid = $('#pgrid');
  function renderProjects(filter) {
    if (!pgrid) return;
    const list = filter === 'all' ? projects : projects.filter(p => p.cat === filter);
    pgrid.innerHTML = list.map(projectCard).join('');
  }
  renderProjects('all');

  // counts
  $$('.ct').forEach(el => {
    const k = el.dataset.count;
    el.textContent = k === 'all' ? projects.length : projects.filter(p => p.cat === k).length;
  });

  // tabs
  $$('#tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#tabs .tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
      renderProjects(tab.dataset.filter);
    });
  });

  /* =========================================================
     3. MODELS — data + schematics
     ========================================================= */
  const SCHEM = {
    reg: `<svg class="mschem" viewBox="0 0 56 38" fill="none"><line x1="6" y1="32" x2="50" y2="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="28" r="2" fill="currentColor"/><circle cx="22" cy="26" r="2" fill="currentColor"/><circle cx="30" cy="18" r="2" fill="currentColor"/><circle cx="40" cy="16" r="2" fill="currentColor"/><circle cx="46" cy="10" r="2" fill="currentColor"/></svg>`,
    mlp: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.95"><g><line x1="10" y1="10" x2="28" y2="8"/><line x1="10" y1="10" x2="28" y2="19"/><line x1="10" y1="10" x2="28" y2="30"/><line x1="10" y1="28" x2="28" y2="8"/><line x1="10" y1="28" x2="28" y2="19"/><line x1="10" y1="28" x2="28" y2="30"/><line x1="28" y1="8" x2="46" y2="19"/><line x1="28" y1="19" x2="46" y2="19"/><line x1="28" y1="30" x2="46" y2="19"/></g><g fill="currentColor" stroke="none"><circle cx="10" cy="10" r="2.4"/><circle cx="10" cy="28" r="2.4"/><circle cx="28" cy="8" r="2.4"/><circle cx="28" cy="19" r="2.4"/><circle cx="28" cy="30" r="2.4"/><circle cx="46" cy="19" r="2.4"/></g></svg>`,
    cnn: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="6" y="6" width="20" height="26" rx="1"/><rect x="20" y="11" width="14" height="18" rx="1"/><rect x="31" y="15" width="9" height="10" rx="1"/><line x1="44" y1="13" x2="50" y2="13"/><line x1="44" y1="19" x2="50" y2="19"/><line x1="44" y1="25" x2="50" y2="25"/></svg>`,
    rnn: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="14" cy="22" r="6"/><circle cx="32" cy="22" r="6"/><circle cx="48" cy="22" r="4"/><path d="M14 16 C14 6, 26 6, 26 14" stroke-dasharray="2 2"/><path d="M32 16 C32 6, 44 6, 44 14" stroke-dasharray="2 2"/><line x1="20" y1="22" x2="26" y2="22"/><line x1="38" y1="22" x2="44" y2="22"/></svg>`,
    tr: `<svg class="mschem" viewBox="0 0 56 38" fill="none"><g fill="currentColor"><rect x="14" y="6" width="6" height="6" opacity="0.9"/><rect x="22" y="6" width="6" height="6" opacity="0.35"/><rect x="30" y="6" width="6" height="6" opacity="0.6"/><rect x="14" y="14" width="6" height="6" opacity="0.4"/><rect x="22" y="14" width="6" height="6" opacity="0.95"/><rect x="30" y="14" width="6" height="6" opacity="0.3"/><rect x="14" y="22" width="6" height="6" opacity="0.55"/><rect x="22" y="22" width="6" height="6" opacity="0.3"/><rect x="30" y="22" width="6" height="6" opacity="0.85"/></g></svg>`
  };

  const models = [
    { schem:'reg', level:1, status:'next', name:'Linear / Logistic Regression',
      ru:'Старт. Веса, функция потерь, градиентный спуск.', en:'The start. Weights, loss, gradient descent.' },
    { schem:'mlp', level:2, status:'plan', name:'MLP',
      ru:'Полносвязная сеть «от руки» на NumPy.', en:'Fully-connected net, built by hand in NumPy.' },
    { schem:'cnn', level:3, status:'plan', name:'CNN',
      ru:'Свёртки и пулинг. Компьютерное зрение.', en:'Convolutions and pooling. Computer vision.' },
    { schem:'rnn', level:4, status:'plan', name:'RNN / LSTM',
      ru:'Последовательности и память во времени.', en:'Sequences and memory over time.' },
    { schem:'tr', level:5, status:'lock', name:'Transformer',
      ru:'Механизм внимания. Финальный босс.', en:'Attention mechanism. The final boss.' }
  ];
  const MSTATUS = {
    next: { cls:'train', ru:'Следующий', en:'Next' },
    plan: { cls:'queue', ru:'В планах', en:'Planned' },
    lock: { cls:'lock',  ru:'Заблокирован', en:'Locked' }
  };

  function modelCard(m) {
    const st = MSTATUS[m.status];
    let dots = '';
    for (let i = 0; i < 5; i++) dots += `<i class="${i < m.level ? 'on' : ''}"></i>`;
    return `
      <article class="mcard ${m.status === 'lock' ? 'locked' : ''}">
        <div class="mcard-top">
          ${SCHEM[m.schem]}
          <span class="state ${st.cls}"><span class="ru">${st.ru}</span><span class="en">${st.en}</span></span>
        </div>
        <h3 class="mname">${esc(m.name)}</h3>
        <p class="mdesc ru">${esc(m.ru)}</p>
        <p class="mdesc en">${esc(m.en)}</p>
        <div class="mmeta">
          <div class="mlevel">${dots}<span class="lab ru">сложность</span><span class="lab en">difficulty</span></div>
        </div>
      </article>`;
  }
  const mgrid = $('#mgrid');
  if (mgrid) mgrid.innerHTML = models.map(modelCard).join('');

  /* =========================================================
     4. STACK meters
     ========================================================= */
  $$('.meter').forEach(m => {
    const lvl = parseInt(m.dataset.level || '0', 10);
    let html = '';
    for (let i = 0; i < 5; i++) {
      const h = 5 + i * 2.5;
      html += `<i class="${i < lvl ? 'on' : ''}" style="height:${h}px"></i>`;
    }
    m.innerHTML = html;
  });

  /* =========================================================
     5. Training curve — milestone dots + draw on reveal
     ========================================================= */
  (() => {
    const line = $('#curveLine');
    const fill = $('#curveFill');
    const dotsG = $('#curveDots');
    if (!line || !dotsG) return;
    // sample points along the path for milestones
    const len = line.getTotalLength();
    const COL = ['#7c4dbe','#3f7fb0','#1f9e8f','#54c469','#a7e34d','#a7e34d'];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const pt = line.getPointAtLength((len * i) / (N - 1));
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      c.setAttribute('r', i === 1 ? 5 : 4);          // e1 = "now" slightly bigger
      c.setAttribute('fill', '#0d1220');
      c.setAttribute('stroke', COL[i]); c.setAttribute('stroke-width', '2');
      dotsG.appendChild(c);
    }
    if (!reduce) {
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset 2s cubic-bezier(.16,1,.3,1)';
      const box = $('#path');
      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          line.style.strokeDashoffset = '0';
          if (fill) fill.style.transition = 'opacity 1.4s .4s ease', fill.style.opacity = '1';
          io.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(box);
    } else if (fill) { fill.style.opacity = '1'; }
  })();

  /* =========================================================
     6. Reveal on scroll
     ========================================================= */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* =========================================================
     7. Scroll: nav state + dots + progress
     ========================================================= */
  const nav = $('#nav');
  const SECTIONS = ['hero', 'stack', 'projects', 'models', 'path', 'contact'];
  const dots = $$('#pageDots button');
  const navA = $$('.nav-links a[href^="#"]');
  const progress = $('#progress');
  let ticking = false;

  function onFrame() {
    ticking = false;
    const y = scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 24);
    let cur = SECTIONS[0];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < innerHeight * 0.5) cur = id;
    }
    dots.forEach(d => {
      const on = d.dataset.target === cur;
      d.classList.toggle('active', on);
      d.setAttribute('aria-current', on ? 'true' : 'false');
    });
    navA.forEach(a => {
      const on = a.getAttribute('href') === '#' + cur;
      a.classList.toggle('active', on);
    });
    if (progress) {
      const max = root.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  dots.forEach(d => d.addEventListener('click', () => {
    const el = document.getElementById(d.dataset.target);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* =========================================================
     8. Language
     ========================================================= */
  function setLang(lang, persist) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    $$('.lang button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (persist) { try { localStorage.setItem('nip.lang', lang); } catch (e) {} }
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang, true)));
  setLang(root.getAttribute('data-lang') || 'ru', false);

  /* =========================================================
     9. Mobile menu
     ========================================================= */
  const burger = $('#burger');
  const mmenu = $('#mmenu');
  function setMenu(open) {
    if (!mmenu || !burger) return;
    mmenu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    mmenu.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('menu-open', open);
  }
  if (burger) burger.addEventListener('click', () => setMenu(!mmenu.classList.contains('open')));
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* =========================================================
     10. Hero HUD — fake training loss ticker
     ========================================================= */
  (() => {
    const lossEl = $('#hLoss'), epEl = $('#hEpoch');
    if (!lossEl || reduce) return;
    let loss = 0.95, epoch = 2;
    setInterval(() => {
      loss -= Math.random() * 0.03 + 0.004;
      if (loss < 0.05) { loss = 0.95; epoch = Math.min(epoch + 1, 9); }
      lossEl.textContent = loss.toFixed(3) + ' ↓';
      if (epEl) epEl.textContent = String(epoch).padStart(2, '0');
    }, 900);
  })();

  /* =========================================================
     11. Year + boot
     ========================================================= */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const hero = $('#hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => net.vis(e.isIntersecting), { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => net.page(!document.hidden));
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => net.resize()); }, { passive: true });
  if (fine && !reduce) addEventListener('mousemove', e => net.pointer(e.clientX, e.clientY), { passive: true });

  function boot() {
    onFrame();
    net.start();
    body.classList.add('go');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();