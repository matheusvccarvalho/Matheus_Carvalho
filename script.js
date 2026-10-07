(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const wide = innerWidth >= 768;

  /* Navbar */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  addEventListener('scroll', () => nav.classList.toggle('s', scrollY > 20), { passive: true });
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Seção atual */
  const links = $$('#menu a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => spy.observe(s));

  /* Reveal */
  const rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .15 });
    rv.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  }

  /* Contadores */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* Terminal */
  const out = $('#termOut');
  const lines = ['> initializing portfolio...', '> loading skills...', '> loading data...', '> loading projects...', '> connection established.', '> mission: dados + código + campo_'];
  let tStarted = false;
  const tio = new IntersectionObserver(es => {
    if (!es[0].isIntersecting || tStarted) return;
    tStarted = true; tio.disconnect();
    if (reduce) { out.textContent = lines.join('\n'); return; }
    let i = 0;
    const next = () => { if (i < lines.length) { out.textContent += (i ? '\n' : '') + lines[i++]; setTimeout(next, 320); } };
    next();
  }, { threshold: .4 });
  tio.observe($('#term'));

  /* Filtro de certificados */
  const fb = $$('.filters button'), certs = $$('#certs li');
  fb.forEach(b => b.addEventListener('click', () => {
    fb.forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    certs.forEach(li => li.classList.toggle('h', f !== 'all' && !li.dataset.c.split(' ').includes(f)));
  }));

  /* Modal "Por que AgroTech?" */
  const why = $('#why');
  $('#whyBtn').addEventListener('click', () => why.showModal());
  $('#whyClose').addEventListener('click', () => why.close());
  why.addEventListener('click', e => { if (e.target === why) why.close(); });

  /* Tilt 3D + cursor (apenas desktop com mouse) */
  if (fine && !reduce) {
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg');
        c.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5)) * 8 + 'deg');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    document.body.classList.add('cur');
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    const follow = () => { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(follow); };
    follow();
    document.addEventListener('pointerover', e => ring.classList.toggle('act', !!e.target.closest('a,button,.card,.tech')));
  }

  /* GitHub: dados públicos reais (API sem token) */
  (async () => {
    const U = 'matheusvccarvalho', api = 'https://api.github.com/';
    const get = async p => { const r = await fetch(api + p); if (!r.ok) throw new Error(r.status); return r.json(); };
    try {
      const [user, repos] = await Promise.all([get('users/' + U), get('users/' + U + '/repos?per_page=100&sort=pushed')]);
      $('#ghName').textContent = user.name || user.login;
      const av = $('#ghAv'); av.src = user.avatar_url + '&s=144'; av.hidden = false;
      const own = repos.filter(r => !r.fork);
      const langs = {};
      own.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
      const lk = Object.keys(langs).sort((a, b) => langs[b] - langs[a]);
      if (lk.length) $('#ghLangs').replaceChildren(...lk.map(l => Object.assign(document.createElement('span'), { textContent: l })));
      $('#ghStat').textContent = user.public_repos + ' repositórios públicos';
      if (own.length) $('#ghRepos').replaceChildren(...own.slice(0, 5).map(r => {
        const li = document.createElement('li'), a = document.createElement('a'), s = document.createElement('span');
        a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = r.name;
        s.textContent = r.language || '';
        a.append(s); li.append(a); return li;
      }));
      const ev = await get('users/' + U + '/events/public?per_page=100').catch(() => null);
      if (ev) {
        const days = {}, key = d => new Date(d).toLocaleDateString('sv');
        ev.filter(e => e.type === 'PushEvent').forEach(e => { const k = key(e.created_at); days[k] = (days[k] || 0) + 1; });
        const cells = [], now = new Date();
        for (let i = 90; i >= 0; i--) {
          const d = new Date(now); d.setDate(now.getDate() - i);
          const k = d.toLocaleDateString('sv'), n = days[k] || 0, c = document.createElement('i');
          if (n) c.className = 'l' + Math.min(n, 4);
          c.title = d.toLocaleDateString('pt-BR') + ': ' + n + (n === 1 ? ' push' : ' pushes');
          cells.push(c);
        }
        $('#ghHeat').replaceChildren(...cells);
        $('#ghNote').textContent = 'Pushes públicos dos últimos ~90 dias (API do GitHub).';
        $('#ghAct').hidden = false;
      }
    } catch (e) { /* sem API: mantém a versão estática do HTML */ }
  })();

  /* Partículas próprias (desligadas em telas pequenas e com reduced-motion) */
  const cv = $('#bg');
  if (!wide || reduce) { cv.remove(); return; }
  const ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -999, y: -999 }, run = true;
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    W /= d; H /= d;
  };
  size();
  addEventListener('resize', size);
  const N = 55;
  for (let i = 0; i < N; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.4 + .6 });
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) draw(); });
  function draw() {
    if (!run) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 14400) { const f = (1 - d2 / 14400) * .6; p.x += dx * f * .02; p.y += dy * f * .02; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.fillStyle = 'rgba(46,229,157,.55)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      for (let j = i + 1; j < N; j++) {
        const q = pts[j], ax = p.x - q.x, ay = p.y - q.y, d = ax * ax + ay * ay;
        if (d < 14000) { ctx.strokeStyle = `rgba(46,229,157,${(1 - d / 14000) * .16})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
