(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const projects = [
    { cat:'js', status:'shipped', title:'NIP.SYS v2', icon:'[ os ]',
      desc:'Прошлая версия портфолио в стиле ОС. Сайдбар, GitHub-статистика.',
      tags:['HTML','CSS','JS'], link:'https://chrisredfield48.github.io/nip.sys-v.02/' },
    { cat:'js', status:'shipped', title:'Projects Hub', icon:'[ ui ]',
      desc:'Витрина JS-проектов с динамическими карточками.',
      tags:['HTML','CSS','JS'], link:'https://chrisredfield48.github.io/Projects/' },
    { cat:'js', status:'shipped', title:'Zodiac Calculator', icon:'[ fn ]',
      desc:'Определение знака зодиака по дате рождения.',
      tags:['JavaScript'], link:'https://chrisredfield48.github.io/zodiac/' },
    { cat:'js', status:'shipped', title:'Birthday Search', icon:'[ fn ]',
      desc:'Поиск дней рождения жильцов по имени.',
      tags:['JavaScript'], link:'https://chrisredfield48.github.io/voda/' },
    { cat:'js', status:'shipped', title:'Graphic Designer', icon:'[ ux ]',
      desc:'Лендинг дизайнера. Вёрстка, UI-компоненты, адаптив.',
      tags:['HTML','CSS'], link:'https://chrisredfield48.github.io/graphic-designer/' },
    { cat:'js', status:'shipped', title:'Python Path', icon:'[ doc ]',
      desc:'Страница прогресса изучения Python. Roadmap.',
      tags:['HTML','CSS'], link:'https://chrisredfield48.github.io/python/' },

    { cat:'py', status:'dev', title:'Neural Net from Scratch', icon:'[ wip ]',
      desc:'Полносвязная сеть на чистом NumPy: прямой проход, backprop, MNIST. Чтобы понять, как оно работает изнутри.',
      tags:['Python','NumPy'] },
    { cat:'py', status:'dev', title:'SOCKS5 Proxy', icon:'[ wip ]',
      desc:'Свой прокси на asyncio для маршрутизации трафика через российский IP. VPS на Ubuntu.',
      tags:['Python','asyncio'] },
    { cat:'py', status:'plan', title:'Image Classifier', icon:'[ soon ]',
      desc:'CNN на PyTorch для классификации изображений. Обучение, аугментации, метрики.',
      tags:['Python','PyTorch','CNN'] },
    { cat:'py', status:'plan', title:'Telegram ML Bot', icon:'[ soon ]',
      desc:'Бот на aiogram, который дёргает обученную модель и отвечает в чат.',
      tags:['Python','aiogram'] },
    { cat:'py', status:'plan', title:'Data Viz Lab', icon:'[ soon ]',
      desc:'Разбор датасетов через Pandas и Matplotlib: чистка, графики, выводы.',
      tags:['Python','Pandas'] }
  ];

  const STATUS = {
    shipped: { cls:'shipped', label:'задеплоено' },
    dev:     { cls:'dev',     label:'в разработке' },
    plan:    { cls:'plan',    label:'в планах' }
  };

  function projectCard(p) {
    const st = STATUS[p.status];
    const tags = p.tags.map(t => `<span class="ptag">${esc(t)}</span>`).join('');
    const link = p.link
      ? `<a class="plink" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.title)} — открыть">открыть <span aria-hidden="true">→</span></a>`
      : `<span class="plink disabled">скоро <span aria-hidden="true">▢</span></span>`;
    return `
      <article class="pcard" data-cat="${esc(p.cat)}">
        <div class="pcard-top">
          <span class="ptag-status ${st.cls}">${st.label}</span>
          <span class="pcard-icon">${esc(p.icon)}</span>
        </div>
        <div class="pcard-body">
          <h3 class="pcard-title">${esc(p.title)}</h3>
          <p class="pcard-desc">${esc(p.desc)}</p>
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

  $$('.ct').forEach(el => {
    const k = el.dataset.count;
    el.textContent = k === 'all' ? projects.length : projects.filter(p => p.cat === k).length;
  });

  $$('#tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#tabs .tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
      renderProjects(tab.dataset.filter);
    });
  });

  const SCHEM = {
    reg: `<svg class="mschem" viewBox="0 0 56 38" fill="none"><line x1="6" y1="32" x2="50" y2="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="28" r="2" fill="currentColor"/><circle cx="22" cy="26" r="2" fill="currentColor"/><circle cx="30" cy="18" r="2" fill="currentColor"/><circle cx="40" cy="16" r="2" fill="currentColor"/><circle cx="46" cy="10" r="2" fill="currentColor"/></svg>`,
    mlp: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.95"><g><line x1="10" y1="10" x2="28" y2="8"/><line x1="10" y1="10" x2="28" y2="19"/><line x1="10" y1="10" x2="28" y2="30"/><line x1="10" y1="28" x2="28" y2="8"/><line x1="10" y1="28" x2="28" y2="19"/><line x1="10" y1="28" x2="28" y2="30"/><line x1="28" y1="8" x2="46" y2="19"/><line x1="28" y1="19" x2="46" y2="19"/><line x1="28" y1="30" x2="46" y2="19"/></g><g fill="currentColor" stroke="none"><circle cx="10" cy="10" r="2.4"/><circle cx="10" cy="28" r="2.4"/><circle cx="28" cy="8" r="2.4"/><circle cx="28" cy="19" r="2.4"/><circle cx="28" cy="30" r="2.4"/><circle cx="46" cy="19" r="2.4"/></g></svg>`,
    cnn: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="6" y="6" width="20" height="26" rx="1"/><rect x="20" y="11" width="14" height="18" rx="1"/><rect x="31" y="15" width="9" height="10" rx="1"/><line x1="44" y1="13" x2="50" y2="13"/><line x1="44" y1="19" x2="50" y2="19"/><line x1="44" y1="25" x2="50" y2="25"/></svg>`,
    rnn: `<svg class="mschem" viewBox="0 0 56 38" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="14" cy="22" r="6"/><circle cx="32" cy="22" r="6"/><circle cx="48" cy="22" r="4"/><path d="M14 16 C14 6, 26 6, 26 14" stroke-dasharray="2 2"/><path d="M32 16 C32 6, 44 6, 44 14" stroke-dasharray="2 2"/><line x1="20" y1="22" x2="26" y2="22"/><line x1="38" y1="22" x2="44" y2="22"/></svg>`,
    tr: `<svg class="mschem" viewBox="0 0 56 38" fill="none"><g fill="currentColor"><rect x="14" y="6" width="6" height="6" opacity="0.9"/><rect x="22" y="6" width="6" height="6" opacity="0.35"/><rect x="30" y="6" width="6" height="6" opacity="0.6"/><rect x="14" y="14" width="6" height="6" opacity="0.4"/><rect x="22" y="14" width="6" height="6" opacity="0.95"/><rect x="30" y="14" width="6" height="6" opacity="0.3"/><rect x="14" y="22" width="6" height="6" opacity="0.55"/><rect x="22" y="22" width="6" height="6" opacity="0.3"/><rect x="30" y="22" width="6" height="6" opacity="0.85"/></g></svg>`
  };

  const models = [
    { schem:'reg', level:1, status:'next', name:'Linear / Logistic Regression',
      desc:'Старт. Веса, функция потерь, градиентный спуск.' },
    { schem:'mlp', level:2, status:'plan', name:'MLP',
      desc:'Полносвязная сеть «от руки» на NumPy.' },
    { schem:'cnn', level:3, status:'plan', name:'CNN',
      desc:'Свёртки и пулинг. Компьютерное зрение.' },
    { schem:'rnn', level:4, status:'plan', name:'RNN / LSTM',
      desc:'Последовательности и память во времени.' },
    { schem:'tr', level:5, status:'lock', name:'Transformer',
      desc:'Механизм внимания. Финальный босс.' }
  ];
  const MSTATUS = {
    next: { cls:'accent', label:'следующий' },
    plan: { cls:'muted',  label:'в планах' },
    lock: { cls:'faint',  label:'заблокирован' }
  };

  function modelCard(m) {
    const st = MSTATUS[m.status];
    let dots = '';
    for (let i = 0; i < 5; i++) dots += `<i class="${i < m.level ? 'on' : ''}"></i>`;
    return `
      <article class="mcard ${m.status === 'lock' ? 'locked' : ''}">
        <div class="mcard-top">
          ${SCHEM[m.schem]}
          <span class="st ${st.cls}">${st.label}</span>
        </div>
        <h3 class="mname">${esc(m.name)}</h3>
        <p class="mdesc">${esc(m.desc)}</p>
        <div class="mlevel">${dots}<span class="lab">сложность</span></div>
      </article>`;
  }
  const mgrid = $('#mgrid');
  if (mgrid) mgrid.innerHTML = models.map(modelCard).join('');

  $$('.lvl').forEach(m => {
    const lvl = parseInt(m.dataset.level || '0', 10);
    let html = '';
    for (let i = 0; i < 5; i++) html += `<i class="${i < lvl ? 'on' : ''}"></i>`;
    m.innerHTML = html;
  });

  (() => {
    const line = $('#curveLine');
    const dotsG = $('#curveDots');
    if (!line || !dotsG || typeof line.getTotalLength !== 'function') return;
    const len = line.getTotalLength();
    if (!len) return;
    const N = 6;
    for (let i = 0; i < N; i++) {
      const pt = line.getPointAtLength((len * i) / (N - 1));
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', pt.x);
      c.setAttribute('cy', pt.y);
      c.setAttribute('r', i === 1 ? 5 : 3.5);
      c.setAttribute('fill', i === 1 ? '#2f9e8d' : '#0c0f15');
      c.setAttribute('stroke', '#2f9e8d');
      c.setAttribute('stroke-width', '1.6');
      dotsG.appendChild(c);
    }
  })();

  const nav = $('#nav');
  const SECTIONS = ['hero', 'stack', 'projects', 'models', 'path', 'contact'];
  const navA = $$('.nav-links a[href^="#"]');
  let ticking = false;

  function onFrame() {
    ticking = false;
    const y = scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 20);
    let cur = SECTIONS[0];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < innerHeight * 0.5) cur = id;
    }
    navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });

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

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  onFrame();
})();