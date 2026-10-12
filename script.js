(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* Navbar */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  if (nav) addEventListener('scroll', () => nav.classList.toggle('s', scrollY > 20), { passive: true });
  if (burger && menu) {
    const isOpen = () => menu.classList.contains('open');
    const setMenu = open => {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    burger.addEventListener('click', () => setMenu(!isOpen()));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', e => { if (isOpen() && !e.target.closest('#menu, #burger')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setMenu(false); burger.focus(); } });
    const mq = matchMedia('(min-width: 761px)');
    if (mq.addEventListener) mq.addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  /* Seção atual */
  const links = $$('#menu a');
  if (hasIO && links.length) {
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('section[id]').forEach(s => spy.observe(s));
  }

  /* Reveal on Scroll: stagger por lote, delay removido após a entrada */
  const rv = $$('.rv');
  if (reduce || !hasIO) {
    rv.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => {
      es.filter(e => e.isIntersecting).forEach((e, i) => {
        const el = e.target;
        el.style.transitionDelay = Math.min(i, 5) * 80 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    rv.forEach(el => io.observe(el));
  }

  /* Terminal decorativo */
  const out = $('#termOut'), termBox = $('#term');
  if (out && termBox) {
    const lines = [
      '> initializing portfolio...',
      '> loading skills...',
      '> loading data...',
      '> loading projects...',
      '> connection established.',
      '> mission: dados + código + campo_'
    ];
    let tStarted = false;
    const run = () => {
      if (tStarted) return;
      tStarted = true;
      if (reduce) { out.textContent = lines.join('\n'); return; }
      let i = 0;
      const next = () => {
        if (i < lines.length) {
          out.textContent += (i ? '\n' : '') + lines[i++];
          setTimeout(next, 320);
        }
      };
      next();
    };
    if (hasIO) {
      const tio = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        tio.disconnect(); run();
      }, { threshold: 0.4 });
      tio.observe(termBox);
    } else run();
  }

  /* Filtro de certificados (aria-pressed reflete o estado real) */
  const fb = $$('.filters button'), certs = $$('#certs li'), certCount = $('#certCount');
  fb.forEach(b => b.addEventListener('click', () => {
    fb.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    const f = b.dataset.f;
    let shown = 0;
    certs.forEach(li => {
      const hide = f !== 'all' && !li.dataset.c.split(' ').includes(f);
      li.classList.toggle('h', hide);
      if (!hide) shown++;
    });
    if (certCount) certCount.textContent = shown + (shown === 1 ? ' certificado exibido' : ' certificados exibidos');
  }));

  /* Modal "Por que AgroTech?" */
  const why = $('#why'), whyBtn = $('#whyBtn'), whyClose = $('#whyClose');
  if (why) {
    const openWhy = () => { if (typeof why.showModal === 'function') why.showModal(); else why.setAttribute('open', ''); };
    const closeWhy = () => { if (typeof why.close === 'function') why.close(); else why.removeAttribute('open'); };
    if (whyBtn) whyBtn.addEventListener('click', openWhy);
    if (whyClose) whyClose.addEventListener('click', closeWhy);
    // fecha só ao clicar no backdrop (cliques no padding do próprio <dialog> não contam)
    why.addEventListener('click', e => {
      if (e.target !== why) return;
      const r = why.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeWhy();
    });
  }

  /* Cursor: anel fluido (translate + scale), rAF só enquanto há movimento */
  if (fine && !reduce) {
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    if (dot && ring) {
      let mx = -100, my = -100, rx = -100, ry = -100, s = 1, ts = 1, hov = false, busy = false;
      document.body.classList.add('cur');
      const loop = () => {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; s += (ts - s) * 0.14;
        ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${s})`;
        if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1 || Math.abs(ts - s) > 0.002) requestAnimationFrame(loop);
        else busy = false;
      };
      const kick = () => { if (!busy) { busy = true; requestAnimationFrame(loop); } };
      addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px,${my}px)`;
        kick();
      }, { passive: true });
      document.addEventListener('pointerover', e => {
        hov = !!(e.target.closest && e.target.closest('a, button, .card, .tech, .photo-frame, .moment-img-wrapper'));
        ring.classList.toggle('act', hov);
        ts = hov ? 1.55 : 1; kick();
      });
      document.addEventListener('pointerdown', () => { ts = hov ? 1.3 : 0.85; kick(); });
      document.addEventListener('pointerup', () => { ts = hov ? 1.55 : 1; kick(); });
    }
  }

  /* GitHub API
     - 3 requisições por visita (perfil, repositórios, eventos), com cache de 30 min em sessionStorage
       e timeout de 8 s, para respeitar o limite de 60 req/h sem autenticação.
     - A lista "Repositórios em destaque" do HTML é curada e NÃO é substituída.
     - O mapa de atividade usa só PushEvents da API de eventos (máx. 100 eventos): não é o gráfico
       oficial de contribuições, e a interface informa isso. Se qualquer requisição falhar,
       o conteúdo estático do HTML permanece. */
  (async () => {
    const U = 'matheusvccarvalho', api = 'https://api.github.com/', TTL = 30 * 60 * 1000;
    const get = async p => {
      const key = 'gh:' + p;
      try {
        const c = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (c && Date.now() - c.t < TTL) return c.d;
      } catch (_) { /* storage indisponível */ }
      // após uma falha (ex.: limite de requisições), não insiste por 5 min
      try { if (Date.now() - Number(sessionStorage.getItem('gh:fail') || 0) < 300000) throw new Error('cooldown'); }
      catch (e) { if (e.message === 'cooldown') throw e; }
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
      try {
        const r = await fetch(api + p, { signal: ctl.signal, headers: { Accept: 'application/vnd.github+json' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (_) { /* cheio/bloqueado */ }
        return d;
      } catch (e) {
        try { sessionStorage.setItem('gh:fail', String(Date.now())); } catch (_) { /* ignorado */ }
        throw e;
      } finally { clearTimeout(to); }
    };
    const ymd = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

    let res;
    try {
      res = await Promise.allSettled([
        get('users/' + U),
        get('users/' + U + '/repos?per_page=100&sort=pushed'),
        get('users/' + U + '/events/public?per_page=100')
      ]);
    } catch (_) { return; }
    const [uR, rR, eR] = res;
    if (res.every(r => r.status === 'rejected')) { console.warn('GitHub API indisponível; mantendo conteúdo estático.'); return; }

    if (uR.status === 'fulfilled' && uR.value) {
      const user = uR.value;
      const nameEl = $('#ghName');
      if (nameEl) nameEl.textContent = user.name || user.login || U;
      const av = $('#ghAv');
      if (av && user.avatar_url) {
        try { const u = new URL(user.avatar_url); u.searchParams.set('s', '144'); av.src = u.href; } catch (_) { av.src = user.avatar_url; }
        av.addEventListener('load', () => { av.hidden = false; }, { once: true });
        av.addEventListener('error', () => { av.hidden = true; }, { once: true });
      }
      const statEl = $('#ghStat');
      if (statEl && typeof user.public_repos === 'number') statEl.textContent = user.public_repos + ' repositórios públicos';
    }

    if (rR.status === 'fulfilled' && Array.isArray(rR.value)) {
      const langs = {};
      rR.value.filter(r => !r.fork).forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
      const lk = Object.keys(langs).sort((a, b) => langs[b] - langs[a]);
      const langsEl = $('#ghLangs');
      if (langsEl && lk.length) {
        // linguagens da API primeiro; os chips estáticos que a API não cobre (ex.: Power BI) são mantidos
        const extra = [...langsEl.children].map(c => c.textContent).filter(t => !lk.includes(t));
        langsEl.replaceChildren(...[...lk, ...extra].map(l => Object.assign(document.createElement('span'), { textContent: l })));
      }
    }

    if (eR.status === 'fulfilled' && Array.isArray(eR.value)) {
      const ev = eR.value, days = {};
      ev.filter(e => e.type === 'PushEvent').forEach(e => { const k = ymd(e.created_at); days[k] = (days[k] || 0) + 1; });
      // a API devolve no máximo 100 eventos: se vier cheia, o histórico anterior ao evento mais antigo é desconhecido
      const truncated = ev.length >= 100;
      const oldest = ev.length ? ymd(ev[ev.length - 1].created_at) : null;
      const cells = [], now = new Date();
      for (let i = 90; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const k = ymd(d), n = days[k] || 0, c = document.createElement('i');
        const unknown = truncated && oldest && k < oldest;
        if (unknown) { c.className = 'u'; c.title = d.toLocaleDateString('pt-BR') + ': sem dados'; }
        else {
          if (n) c.className = 'l' + Math.min(n, 4);
          c.title = d.toLocaleDateString('pt-BR') + ': ' + n + (n === 1 ? ' push' : ' pushes');
        }
        c.style.setProperty('--i', cells.length);
        cells.push(c);
      }
      const heatEl = $('#ghHeat');
      if (heatEl) heatEl.replaceChildren(...cells);
      const noteEl = $('#ghNote');
      if (noteEl) noteEl.textContent = 'Pushes públicos recentes retornados pela API de eventos do GitHub (até 100 eventos). ' +
        'Não equivale ao gráfico oficial de contribuições.' + (truncated ? ' Dias anteriores ao primeiro evento retornado aparecem apagados (sem dados).' : '');
      const actEl = $('#ghAct');
      if (actEl) actEl.hidden = false;
      if (heatEl) {
        if (reduce || !hasIO) heatEl.classList.add('on');
        else new IntersectionObserver((es, o) => {
          if (es[0].isIntersecting) { heatEl.classList.add('on'); o.disconnect(); }
        }, { threshold: 0.3 }).observe(heatEl);
      }
    }
  })();

  /* Partículas: verde-esmeralda, brilho via sprite pré-renderizado, linhas agrupadas em poucos
     traços (4 faixas de opacidade) para reduzir o custo por frame. */
  const cv = $('#bg');
  if (reduce || !cv) { if (cv) cv.remove(); return; }
  const ctx = cv.getContext('2d');
  if (!ctx) { cv.remove(); return; }
  let W = 0, H = 0, raf = 0, last = 0, ox = 0, oy = 0, rt, heroF = 0.9;
  const mouse = { x: -999, y: -999 };
  const pts = [];
  const LINK = 190, LINK2 = LINK * LINK, MARGIN = 30, BK = 4, MAXA = 0.76;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;

  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  (() => {
    const g = glow.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(16,185,129,0.55)');
    r.addColorStop(0.35, 'rgba(16,185,129,0.2)');
    r.addColorStop(1, 'rgba(16,185,129,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  })();

  const targetCount = () => Math.max(26, Math.min(weak ? 38 : 64, Math.round(innerWidth * innerHeight / 20000)));

  const spawn = p => {
    const z = 0.45 + Math.random() * 0.55;
    Object.assign(p, {
      x: Math.random() * W, y: Math.random() * H, z,
      ang: Math.random() * 6.283, spd: (0.14 + Math.random() * 0.16) * z,
      r: 1.3 + z * 1.2, ph: Math.random() * 6.283, wob: 0.6 + Math.random() * 0.8,
      glow: Math.random() < 0.28, a: 0.6, dx: 0, dy: 0
    });
    return p;
  };

  const size = force => {
    // no mobile, a barra de endereço dispara resize a cada rolagem: ignora variações pequenas de altura
    if (!force && W && innerWidth === W && Math.abs(innerHeight - H) < 150) return;
    const d = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = targetCount();
    while (pts.length < n) pts.push(spawn({}));
    if (pts.length > n) pts.length = n;
    pts.forEach(p => { if (p.x > W) p.x = Math.random() * W; if (p.y > H) p.y = Math.random() * H; });
  };
  size(true);

  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => size(false), 150); });
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener('pointerout', e => { if (!e.relatedTarget) { mouse.x = mouse.y = -999; } });
  addEventListener('scroll', () => { heroF = 0.9 + 0.1 * Math.min(1, scrollY / (innerHeight * 0.8)); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf); raf = 0;
    if (!document.hidden) { last = 0; raf = requestAnimationFrame(draw); }
  });

  function draw(now) {
    raf = requestAnimationFrame(draw);
    const k = last ? Math.min(3, (now - last) / 16.67) : 1;   // normaliza para ~60 fps
    last = now;
    ctx.clearRect(0, 0, W, H);

    if (mouse.x > -900) {
      ox += ((mouse.x - W / 2) / W * -18 - ox) * 0.04 * k;
      oy += ((mouse.y - H / 2) / H * -18 - oy) * 0.04 * k;
    }

    const N = pts.length;
    for (const p of pts) {
      p.ang += Math.sin(now * 0.0004 * p.wob + p.ph) * 0.014 * k;
      let vx = Math.cos(p.ang) * p.spd, vy = Math.sin(p.ang) * p.spd;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 19600 && d2 > 1) {
        const d = Math.sqrt(d2), f = (1 - d / 140) ** 2 * 1.6 * p.z;
        vx += dx / d * f; vy += dy / d * f;
      }
      p.x += vx * k; p.y += vy * k;
      if (p.x < -MARGIN) p.x = W + MARGIN; else if (p.x > W + MARGIN) p.x = -MARGIN;
      if (p.y < -MARGIN) p.y = H + MARGIN; else if (p.y > H + MARGIN) p.y = -MARGIN;
      p.a = (0.6 + 0.3 * p.z) * (0.85 + 0.15 * Math.sin(p.ph + now * 0.0015)) * heroF;
      p.dx = p.x + ox * p.z; p.dy = p.y + oy * p.z;
    }

    // linhas: acumuladas em BK Path2D por faixa de opacidade (4 strokes em vez de ~2000)
    const paths = [];
    for (let b = 0; b < BK; b++) paths.push(new Path2D());
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      for (let j = i + 1; j < N; j++) {
        const q = pts[j], ax = p.dx - q.dx, ay = p.dy - q.dy, d2 = ax * ax + ay * ay;
        if (d2 < LINK2) {
          const al = (1 - Math.sqrt(d2) / LINK) * 0.85 * Math.min(p.a, q.a);
          if (al < 0.015) continue;
          const b = Math.min(BK - 1, Math.floor(al / MAXA * BK)), pa = paths[b];
          pa.moveTo(p.dx, p.dy); pa.lineTo(q.dx, q.dy);
        }
      }
    }
    ctx.lineWidth = 0.8;
    for (let b = 0; b < BK; b++) {
      ctx.strokeStyle = `rgba(14,155,110,${((b + 0.5) / BK * MAXA).toFixed(3)})`;
      ctx.stroke(paths[b]);
    }
    for (const p of pts) {
      const al = Math.min(1, p.a).toFixed(3);
      if (p.glow) {
        const s = p.r * 9;
        ctx.globalAlpha = Math.min(1, p.a);
        ctx.drawImage(glow, p.dx - s, p.dy - s, s * 2, s * 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(52,211,153,${al})`;
        ctx.beginPath(); ctx.arc(p.dx, p.dy, p.r * 1.35, 0, 6.283); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(16,185,129,${al})`;
        ctx.beginPath(); ctx.arc(p.dx, p.dy, p.r, 0, 6.283); ctx.fill();
      }
    }
  }
  raf = requestAnimationFrame(draw);
})();

/* =====================================================================
   CENA AGROTECH · jovem programador + colheitadeira (o SVG fica no index.html)
   Um único requestAnimationFrame, pausado fora da tela / aba oculta (as animações CSS
   também são congeladas). Independente de fps (dt), sem bibliotecas.

   Paisagem: árvores em duas camadas, lavoura em perspectiva, 5 planos de milho,
   vento em onda (a rolagem gera rajada).
   Programador: braços por cinemática inversa (2 ossos), dedos em ritmo irregular, teclas
   que acendem, cabeça que lê a tela; ciclo digitar → executar (✓/✗) → pensar → corrigir;
   código "digitado" linha a linha, com rolagem e saída de terminal.
   Colheitadeira: percorre a lavoura (X0 → X1), rodas e molinete giram pela distância
   percorrida, plantas à frente do cabeçote inclinam, são cortadas e viram restolho.
   Dados: pacotes saem da antena, chegam ao painel e atualizam indicadores
   ILUSTRATIVOS (não são dados agrícolas reais).
   ===================================================================== */
(() => {
  'use strict';
  const root = document.querySelector('.scene-container');
  const svg = root && root.querySelector('.scene-art');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAD = 57.2958;
  const n1 = v => v.toFixed(1);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const damp = (cur, tgt, k, dt) => cur + (tgt - cur) * (1 - Math.exp(-k * dt));   // suavização independente de fps
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  const $ = id => svg.querySelector('#' + id);
  const g = {
    trees: $('agTrees'), trees2: $('agTrees2'), rows: $('agRows'), stubble: $('agStubble'), stubLines: $('agStubLines'), stubRect: $('agStubRect'),
    lane: $('agLaneCrops'), front: $('agFrontCrops'), near: $('agNearGrass'),
    harv: $('agHarv'), bob: $('agBob'), hdr: $('agHdr'), reel: $('agReel'), straw: $('agStraw'), smoke: $('agSmoke'),
    fx: $('agFx'), whA: $('agWhA'), whB: $('agWhB'), grain: $('agGrain'),
    link: $('agLink'), ring: $('agRing'), border: $('agBorder'),
    area: $('agArea'), yld: $('agYield'), prog: $('agProg'), bar: $('agBar'),
    pkts: [...svg.querySelectorAll('.ag-pkt')]
  };
  const missing = Object.entries(g).filter(([k, v]) => k !== 'pkts' && !v).map(([k]) => k);
  if (missing.length || !g.pkts.length) {
    console.warn('Cena AgroTech: elementos SVG ausentes:', missing.join(', ') || 'pacotes');
    return;
  }

  /* aleatoriedade determinística: a paisagem é sempre igual */
  let seed = 11;
  const rnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };

  /* ===================================================================
     PAISAGEM
     =================================================================== */
  const blob = (x, y, w, h) =>
    `M${n1(x - w)},${n1(y)}C${n1(x - w)},${n1(y - h * .6)} ${n1(x - w * .45)},${n1(y - h)} ${n1(x)},${n1(y - h)}` +
    `C${n1(x + w * .45)},${n1(y - h)} ${n1(x + w)},${n1(y - h * .6)} ${n1(x + w)},${n1(y)}Z`;

  const buildTrees = () => {
    const f = document.createDocumentFragment();
    const far = ['', ''], near = ['', '', ''];
    let hi = '';
    for (let x = -6; x < 490; x += rnd(5, 9)) far[Math.floor(rnd(0, 2))] += blob(x, 104, rnd(4, 7), rnd(6, 11));
    for (let x = -4; x < 490; x += rnd(7, 13)) {
      const w = rnd(5, 9), h = rnd(8, 15);
      near[Math.floor(rnd(0, 3))] += blob(x, 105, w, h);
      if (rnd() < .6) hi += blob(x + w * .45, 105 - h * .22, w * .5, h * .55);
    }
    ['#1b2e24', '#20352a'].forEach((c, i) => mk('path', { d: far[i], fill: c }, f));
    ['#101b16', '#13221b', '#0f1913'].forEach((c, i) => mk('path', { d: near[i], fill: c }, f));
    mk('path', { d: hi, fill: '#c8923c', 'fill-opacity': .2 }, f);
    g.trees.appendChild(f);
  };

  const buildTrees2 = () => {
    const f = document.createDocumentFragment();
    let a = '', b = '', c = '', hi = '';
    for (let x = -4; x < 490; x += rnd(6, 10)) a += blob(x, 121, rnd(3, 5), rnd(5, 9));
    for (let x = -8; x < 190; x += rnd(12, 18)) {
      const w = rnd(8, 14), h = rnd(12, 20), y = rnd(124, 130);
      if (rnd() < .5) b += blob(x, y, w, h); else c += blob(x, y, w, h);
      hi += blob(x + w * .4, y - h * .2, w * .5, h * .55);
    }
    mk('path', { d: a, fill: '#2a4a26', 'fill-opacity': .85 }, f);
    mk('path', { d: b, fill: '#16301f' }, f);
    mk('path', { d: c, fill: '#1b3a24' }, f);
    mk('path', { d: hi, fill: '#d9a850', 'fill-opacity': .16 }, f);
    g.trees2.appendChild(f);
  };

  const buildRows = () => {
    const N = 18, ys = [];
    for (let k = 0; k <= N; k++) ys.push(100 + 200 * Math.pow(k / N, 1.75));
    const f = document.createDocumentFragment();
    for (let k = 0; k < N; k++) {
      const t = k / N, y0 = ys[k], y1 = ys[k + 1];
      if (k % 2) mk('rect', { x: 0, y: n1(y0), width: 480, height: n1(y1 - y0), fill: '#0d1a08', 'fill-opacity': (.1 + .14 * t).toFixed(3) }, f);
      mk('path', { d: `M0,${n1(y0)}H480`, fill: 'none', stroke: '#ffe3a0', 'stroke-opacity': (.04 + .04 * t).toFixed(3), 'stroke-width': (.3 + .9 * t).toFixed(2) }, f);
    }
    for (let k = 0; k < 12; k++) {
      const t = k / 11;
      mk('path', {
        d: `M0,${n1(106 + t * 40)}H480`, fill: 'none', stroke: k % 2 ? '#d9bf50' : '#b8a040',
        'stroke-width': (.5 + .8 * t).toFixed(2), 'stroke-dasharray': `${(.7 + .6 * t).toFixed(2)} ${(1.8 + 1.5 * t).toFixed(2)}`,
        'stroke-dashoffset': n1(k * 1.3), opacity: (.2 + .22 * t).toFixed(2)
      }, f);
    }
    g.rows.appendChild(f);
  };

  /* touceira de grão maduro (faixa que a colheitadeira corta): <g.ag-bend> (inclinação/corte via JS)
     > <g.ag-sway> (balanço via CSS). O atraso depende de x: o vento corre pela lavoura como uma onda. */
  const tuft = (parent, x, y, h, pal, seedColor) => {
    const outer = mk('g', { class: 'ag-bend' }, parent);
    const inner = mk('g', { class: 'ag-sway' }, outer);
    const dur = rnd(4.5, 7.5);
    inner.style.setProperty('--dur', dur.toFixed(2) + 's');
    inner.style.setProperty('--del', (-(x / 480) * dur * .9 - rnd(0, .6)).toFixed(2) + 's');
    const sw = Math.max(.55, h * .06), cnt = 4;
    for (let i = 0; i < cnt; i++) {
      const dx = (i - (cnt - 1) / 2) * h * .13 + rnd(-.8, .8);
      const lean = rnd(-.14, .14) * h + dx * .4;
      const hh = h * rnd(.78, 1);
      mk('path', {
        d: `M${n1(x + dx)},${n1(y)} Q${n1(x + dx + lean * .3)},${n1(y - hh * .55)} ${n1(x + dx + lean)},${n1(y - hh)}`,
        fill: 'none', stroke: pal[Math.floor(rnd(0, pal.length))], 'stroke-width': sw.toFixed(2), 'stroke-linecap': 'round'
      }, inner);
      mk('path', {
        d: `M${n1(x + dx + lean)},${n1(y - hh)} l${n1(lean * .18)},${n1(-h * .2)}`,
        fill: 'none', stroke: seedColor, 'stroke-width': (sw * 2.4).toFixed(2), 'stroke-linecap': 'round'
      }, inner);
    }
    return outer;
  };

  const addCorn = (acc, x, y, h) => {
    const lean = rnd(-.07, .07) * h, tx = x + lean, ty = y - h;
    acc.stalk += `M${n1(x)},${n1(y)}Q${n1(x + lean * .2)},${n1(y - h * .5)} ${n1(tx)},${n1(ty)}`;
    const pairs = h > 34 ? 4 : h > 24 ? 3 : 2;
    for (let i = 0; i < pairs; i++) {
      const t = .16 + i * (.6 / pairs) + rnd(0, .05), yy = y - h * t, xx = x + lean * t;
      const L = h * rnd(.3, .42);
      for (const dir of [-1, 1]) {
        if (rnd() < .18) continue;
        const k = rnd() < .5 ? 'leafA' : 'leafB';
        acc[k] += `M${n1(xx)},${n1(yy)}Q${n1(xx + dir * L * .55)},${n1(yy - h * .16)} ${n1(xx + dir * L)},${n1(yy + h * .05)}` +
                  `Q${n1(xx + dir * L * .5)},${n1(yy - h * .05)} ${n1(xx)},${n1(yy + h * .04)}Z`;
      }
    }
    const e = Math.max(.9, h * .075), ey = ty + e * .6;
    acc[rnd() < .5 ? 'earA' : 'earB'] +=
      `M${n1(tx)},${n1(ey)}Q${n1(tx + e * .75)},${n1(ey - e * .9)} ${n1(tx + e * .15)},${n1(ey - e * 2.5)}` +
      `Q${n1(tx - e * .7)},${n1(ey - e * .9)} ${n1(tx)},${n1(ey)}Z`;
  };
  const cornBlock = (parent, pal, plants) => {
    const acc = { stalk: '', leafA: '', leafB: '', earA: '', earB: '' };
    let hs = 0, xs = 0;
    plants.forEach(p => { addCorn(acc, p[0], p[1], p[2]); hs += p[2]; xs += p[0]; });
    const hm = hs / plants.length, xm = xs / plants.length;
    const grp = mk('g', { class: 'ag-skew' }, parent), dur = rnd(4.5, 7.5);
    grp.style.setProperty('--dur', dur.toFixed(2) + 's');
    grp.style.setProperty('--del', (-(xm / 480) * dur * .9 - rnd(0, .8)).toFixed(2) + 's');
    mk('path', { d: acc.stalk, fill: 'none', stroke: pal.stalk, 'stroke-width': Math.max(.5, hm * .045).toFixed(2), 'stroke-linecap': 'round' }, grp);
    mk('path', { d: acc.leafA, fill: pal.leafA }, grp);
    mk('path', { d: acc.leafB, fill: pal.leafB }, grp);
    mk('path', { d: acc.earA, fill: pal.earA }, grp);
    mk('path', { d: acc.earB, fill: pal.earB }, grp);
    return grp;
  };

  const PAL = [
    { stalk: '#7a8230', leafA: '#8a9234', leafB: '#a39a3c', earA: '#e6c95a', earB: '#d2b248' },
    { stalk: '#5e6f2a', leafA: '#6a8030', leafB: '#84913a', earA: '#e0c050', earB: '#cfae3c' },
    { stalk: '#4a6126', leafA: '#4f6d2a', leafB: '#6b8232', earA: '#dcb83e', earB: '#e8cc5c' },
    { stalk: '#38522a', leafA: '#3d5f2b', leafB: '#55752f', earA: '#d6b038', earB: '#e4c456' },
    { stalk: '#2c4626', leafA: '#2f5129', leafB: '#44662d', earA: '#d2aa32', earB: '#e0be4e' }
  ];
  const PAL_NEAR = { stalk: '#1f3a1c', leafA: '#24441f', leafB: '#33582a', earA: '#d9b43a', earB: '#f0cc5c' };
  const CROWS = [
    { y: 190, h: 14, st: 6, p: 0 },
    { y: 199, h: 18, st: 7.5, p: 1 },
    { y: 210, h: 23, st: 9, p: 2 },
    { y: 224, h: 30, st: 11, p: 3 },
    { y: 232, h: 34, st: 12.5, p: 3 },
    { y: 240, h: 38, st: 14, p: 4 }
  ];

  const lane = [];
  const buildCrops = () => {
    const ripe = ['#b8a040', '#9c8a36', '#c7b050'];
    for (let x = 6; x < 478; x += rnd(8, 12)) lane.push({ el: tuft(g.lane, x, 180 + rnd(-2, 2), rnd(10, 14), ripe, '#e0c460'), x, s: -1 });
    CROWS.forEach(r => {
      let batch = [];
      for (let x = -6; x < 488; x += r.st * rnd(.85, 1.15)) {
        batch.push([x, r.y + rnd(-1.2, 1.2), r.h * rnd(.85, 1.15)]);
        if (batch.length >= 8) { cornBlock(g.front, PAL[r.p], batch); batch = []; }
      }
      if (batch.length) cornBlock(g.front, PAL[r.p], batch);
    });
    for (let x = 8; x < 480; x += rnd(18, 28)) cornBlock(g.near, PAL_NEAR, [[x, rnd(290, 298), rnd(30, 44)]]);
  };

  const STRAW = [];
  const buildFx = () => {
    const f = document.createDocumentFragment();
    const puff = (parent, cls, cx, cy, r, fill, tx, ty, s, dur, del) => {
      const c = mk('circle', { class: cls, cx: n1(cx), cy: n1(cy), r: r.toFixed(2), fill }, parent);
      c.style.cssText = `--tx:${n1(tx)}px;--ty:${n1(ty)}px;--s:${s};--dur:${dur.toFixed(2)}s;--del:${(-del).toFixed(2)}s`;
    };
    for (let i = 0; i < 9; i++) puff(f, 'ag-p', 151, -30 + rnd(-3, 3), rnd(.9, 1.7), i % 3 ? '#d7bf45' : '#cdb85a', rnd(24, 46), rnd(8, 24), 1, rnd(1.6, 2.6), rnd(0, 2.6));
    for (let i = 0; i < 6; i++) puff(f, 'ag-p', 88 + rnd(0, 6), -2, rnd(1.8, 3), '#d9c78e', rnd(16, 30), rnd(-14, -5), 2.2, rnd(2.6, 4), rnd(0, 4));
    for (let i = 0; i < 3; i++) puff(f, 'ag-p', 142, -1, rnd(1.4, 2.2), '#d9c78e', rnd(12, 22), rnd(-10, -4), 2, rnd(2.4, 3.4), rnd(0, 3));
    for (let i = 0; i < 4; i++) puff(f, 'ag-p', 4 + rnd(0, 8), -6 + rnd(-2, 2), rnd(.8, 1.4), '#e0c460', rnd(10, 22), rnd(-18, -8), 1.2, rnd(1.2, 2), rnd(0, 2));
    g.fx.appendChild(f);
    for (let i = 0; i < 4; i++) puff(g.smoke, 'ag-smoke', 133 + rnd(-.4, .4), -58, rnd(1.4, 2), '#aab4ae', rnd(10, 20), rnd(-26, -16), 2.8, rnd(2.6, 3.6), i * .9);
    for (let i = 0; i < 7; i++) STRAW.push(mk('circle', { r: (rnd(.7, 1.2)).toFixed(2), opacity: 0 }, g.straw));
  };
  const STRAW_PATH = [[6, -16], [24, -15], [40, -24], [56, -42]];
  const strawAt = s => {
    const seg = Math.min(2, Math.floor(s * 3)), u = s * 3 - seg, a = STRAW_PATH[seg], b = STRAW_PATH[seg + 1];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  };

  /* ===================================================================
     COLHEITADEIRA
     SPEED era 2,4 u/s (43 s por passada, ~2 px/s na tela: parecia parada).
     Agora 8 u/s: ~13 s por passada, deslocamento claramente perceptível.
     =================================================================== */
  const SC = .6;                              // escala do grupo da máquina
  const X0 = 318, X1 = 214, SPEED = 8;        // unidades do SVG e unidades/s
  const AX = 45.6, AY = 125.8;                // antena (76,-87 locais × SC) em relação ao translate (x,178)
  const PX = 166, PY = 52;                    // ponto do painel onde a ligação termina
  let x = X0, runT = 0, tt = 0, speed = 0, strawT = 0;

  const frac = () => clamp((X0 - x) / (X0 - X1), 0, 1);

  const place = () => {
    g.harv.setAttribute('transform', `translate(${n1(x)} 178) scale(${SC})`);
    const ax = x + AX, ay = AY;
    g.link.setAttribute('d', `M${n1(ax)},${n1(ay)} C${n1(ax)},${n1(ay - 64)} ${n1((ax + PX) / 2 + 8)},44 ${PX},${PY}`);
    g.ring.setAttribute('cx', n1(ax)); g.ring.setAttribute('cy', n1(ay));
    g.stubble.setAttribute('d', `M${n1(x + 4)},170 L480,170 L480,185 L${n1(x + 4)},185Z`);
    g.stubRect.setAttribute('x', n1(x + 4)); g.stubRect.setAttribute('width', n1(480 - (x + 4)));

    // rodas: rolagem sem deslizamento (ângulo = distância / raio)
    const dist = (X0 - x) / SC;
    g.whA.setAttribute('transform', `rotate(${((-dist / 15 * RAD) % 360).toFixed(1)})`);
    g.whB.setAttribute('transform', `rotate(${((-dist / 9 * RAD) % 360).toFixed(1)})`);
    g.reel.setAttribute('transform', `rotate(${((-dist / 12 * RAD * 1.3) % 360).toFixed(1)})`);
    g.grain.style.transform = `scaleY(${(.2 + .75 * frac()).toFixed(3)})`;

    // terreno: oscilações suaves do chassi e da plataforma
    const w = Math.min(1, speed / SPEED);
    const bob = (Math.sin(tt * 1.7) * .28 + Math.sin(tt * 3.1 + 1) * .16) * w;
    const pitch = (Math.sin(tt * .9) * .22 + Math.sin(tt * 2.3) * .1) * w;
    g.bob.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(${pitch.toFixed(2)} 76 0)`);
    g.hdr.setAttribute('transform', `rotate(${(Math.sin(tt * 1.3 + .5) * .45 * w).toFixed(2)} 44 -18)`);

    // fileiras: inclinam perto do cabeçote, são cortadas e viram restolho
    const hx = x + 1;
    for (const c of lane) {
      const d = hx - c.x;                     // >0: planta ainda à frente do cabeçote
      if (d > 34) { if (c.s !== 0) { c.s = 0; c.el.style.transform = ''; c.el.style.opacity = ''; } continue; }
      if (d < -7) { if (c.s !== 2) { c.s = 2; c.el.style.transform = 'scaleY(.18)'; c.el.style.opacity = '.85'; } continue; }
      c.s = 1;
      const a = clamp(1 - d / 34, 0, 1);
      let rot = 9 * a * a, sy = 1, op = 1;
      if (d < 0) { const b = ease(clamp(-d / 7, 0, 1)); sy = 1 - .82 * b; rot *= 1 - b; op = 1 - .15 * b; }
      c.el.style.transform = `rotate(${rot.toFixed(2)}deg) scaleY(${sy.toFixed(3)})`;
      c.el.style.opacity = op.toFixed(2);
    }
  };
  const resetCrops = () => lane.forEach(c => { c.s = -1; c.el.style.transform = ''; c.el.style.opacity = ''; });

  const animateStraw = dt => {
    strawT += dt * .7 * (speed / SPEED);
    for (let i = 0; i < STRAW.length; i++) {
      const s = (strawT + i / STRAW.length) % 1, p = strawAt(s), el = STRAW[i];
      el.setAttribute('cx', n1(p[0] + Math.sin(i * 3 + s * 9) * 1.2));
      el.setAttribute('cy', n1(p[1] + Math.cos(i * 2 + s * 7) * .8));
      el.setAttribute('opacity', (Math.sin(Math.PI * s) * .9).toFixed(2));
    }
  };

  /* ---------- painel de indicadores (valores ILUSTRATIVOS) ----------
     Progresso e área acompanham a passada da colheitadeira e são atualizados quando um pacote
     chega ao painel; produtividade fica fixa. Nada aqui vem de medições reais. */
  const render = (a, y, p) => {
    g.area.textContent = a.toFixed(1).replace('.', ',') + ' ha';
    g.yld.textContent = '~' + Math.round(y) + ' sc/ha';
    g.prog.textContent = Math.round(p) + '%';
  };
  const setBar = p => { g.bar.style.transform = 'scaleX(' + clamp(p / 100, 0, 1).toFixed(3) + ')'; };
  const target = f => { const p = 12 + 86 * f; return { a: p * .271, y: 61, p }; };
  let cur = target(0), tw = null;
  const retarget = (f, now) => { tw = { from: cur, to: target(f), t0: now, dur: 900 }; };
  const stepTween = now => {
    if (!tw) return;
    const k = Math.min(1, (now - tw.t0) / tw.dur), e = 1 - Math.pow(1 - k, 3), a = tw.from, b = tw.to;
    cur = { a: lerp(a.a, b.a, e), y: lerp(a.y, b.y, e), p: lerp(a.p, b.p, e) };
    render(cur.a, cur.y, cur.p); setBar(cur.p);
    if (k >= 1) { cur = b; tw = null; }
  };

  /* ===================================================================
     PROGRAMADOR
     =================================================================== */
  const buildDev = () => {
    const hands = ['N', 'F'].map(k => {
      const arm = $('agArm' + k);
      const hi = [];
      if (arm) {
        const edge = (stroke, w, op, tr) => {
          const p = mk('path', { fill: 'none', stroke, 'stroke-width': w, opacity: op, transform: tr, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
          arm.after(p); hi.push(p);
        };
        if (k === 'N') edge('#10b981', .8, .75, 'translate(-1.8 2.8)');
        edge('#ffd9a0', 1, .26, 'translate(2.2 -2.6)');
      }
      return { arm, hi, hand: $('agHand' + k), fing: [...svg.querySelectorAll('#agHand' + k + ' .ag-f')] };
    });
    const e = {
      torso: $('agTorso'), head: $('agHead'), code: $('agCode'), dot: $('agDot'), spin: $('agSpin'),
      check: $('agCheck'), cross: $('agCross'), status: $('agStatus'), bar: $('agRunBar'), flash: $('agFlash'),
      cone: $('agConeLight'), glow: $('agScrGlow'), ground: $('agGlowGround'), face: $('agFaceGlow'),
      foot: $('agFoot'), keys: $('agKeys'), desk: $('agDeskGlow')
    };
    if (Object.values(e).some(v => !v) || hands.some(h => !h.arm || !h.hand || h.fing.length < 3)) {
      console.warn('Cena AgroTech: elementos do programador ausentes; animação do personagem desativada.');
      return null;
    }

    // ombros e comprimentos dos ossos (coordenadas locais do tronco); mãos em repouso sobre o teclado
    const SH = [{ x: 98, y: 182, a: 27, b: 23 }, { x: 104, y: 180, a: 27, b: 23 }];
    const HB = [{ x: 131, y: 203 }, { x: 139, y: 204.5 }];
    const FY = [-1.4, 0, 1.4];

    // teclas que acendem quando os dedos batem: mão próxima = teclas 0-2, mão distante = teclas 3-5
    const keys = [];
    for (let i = 0; i < 6; i++) {
      const kx = 134 + i * 5.6;
      keys.push(mk('rect', { x: kx.toFixed(1), y: (210.2 - (kx - 133) * .057).toFixed(2), width: 3.2, height: 1.1, rx: .4, fill: '#6ee7b7', opacity: 0 }, e.keys));
    }

    let s2 = 7;
    const r2 = (a = 0, b = 1) => { s2 = (s2 * 48271) % 2147483647; return a + (s2 / 2147483647) * (b - a); };

    const LH = 3.9, Y0 = 5.6, ROWS = 5;
    const pal = ['#10b981', '#84cc16', '#cbd5d0', '#e0a24c', '#6e9bb5', '#8aa096'];
    const S = {
      st: 'type', t: 0, dur: 5, amp: .6, key: 0, head: 0, off: 0, n: 0, lines: [],
      cur: null, prog: 0, flash: 0, ok: false, bad: false, retry: false, glance: 0,
      ptr: null, pause: 0, nextPause: 3
    };
    const hl = mk('rect', { x: 4.2, width: 35.6, height: 2.7, fill: '#12261c', opacity: 0 }, e.code);
    const cursor = mk('rect', { width: .8, height: 2, fill: '#eaf1ec', opacity: 0 }, e.code);

    const genLine = kind => {
      const tokens = [];
      let px = 5.2 + (kind === 'code' ? [0, 0, 2.4, 2.4, 4.8][Math.floor(r2(0, 5))] : 0);
      const n = kind === 'out' ? 2 : 2 + Math.floor(r2(0, 3));
      for (let i = 0; i < n; i++) {
        let w = kind === 'out' ? (i ? r2(8, 16) : 1.6) : r2(2, 8.5);
        if (px + w > 38.5) w = 38.5 - px;
        if (w < 1.2) break;
        tokens.push({ x: px, w, c: kind === 'out' ? (i ? '#6b8577' : '#84cc16') : pal[Math.floor(r2(0, pal.length))] });
        px += w + 1.2;
      }
      return tokens.length ? tokens : [{ x: 5.2, w: 4, c: pal[0] }];
    };
    const addLine = (kind, full, bad) => {
      const tokens = genLine(kind);
      if (bad) { tokens[0].c = '#ef6a5a'; if (tokens[1]) tokens[1].c = '#b9786e'; }
      const grp = mk('g', { transform: `translate(0 ${(Y0 + S.n * LH).toFixed(2)})` }, e.code);
      if (kind === 'code') mk('rect', { x: 1, y: .1, width: 1.7, height: 1.2, rx: .4, fill: '#2a3a32' }, grp);
      const rects = tokens.map(t => mk('rect', {
        x: t.x.toFixed(2), y: 0, width: full ? t.w.toFixed(2) : 0, height: 1.5, rx: .5, fill: t.c, opacity: kind === 'out' ? 1 : .9
      }, grp));
      const last = tokens[tokens.length - 1];
      const L = { grp, tokens, rects, x0: tokens[0].x, total: last.x + last.w - tokens[0].x, row: S.n };
      S.n++; S.lines.push(L);
      while (S.lines.length > 9) S.lines.shift().grp.remove();
      return L;
    };
    const reveal = (L, p) => {
      const edge = L.x0 + p;
      for (let i = 0; i < L.tokens.length; i++) L.rects[i].setAttribute('width', clamp(edge - L.tokens[i].x, 0, L.tokens[i].w).toFixed(2));
    };
    const STAT = { idle: '#0f3d2a', run: '#7a5f1a', ok: '#126b47', bad: '#8a2b22' };
    const setStat = mode => {
      e.dot.setAttribute('opacity', mode === 'idle' ? 1 : 0);
      e.spin.setAttribute('opacity', mode === 'run' ? 1 : 0);
      e.check.setAttribute('opacity', mode === 'ok' ? 1 : 0);
      e.cross.setAttribute('opacity', mode === 'bad' ? 1 : 0);
      e.status.setAttribute('fill', STAT[mode]);
    };

    for (let i = 0; i < ROWS - 1; i++) addLine(i === 3 ? 'out' : 'code', true);
    S.cur = addLine('code', false);
    S.dur = r2(3.5, 6);

    // ciclo: digitar → executar → (pensar | digitar) → ...; um erro ocasional leva a pensar e corrigir
    const next = () => {
      S.t = 0;
      if (S.st === 'type') {
        if (S.cur) { reveal(S.cur, S.cur.total); S.cur = null; }
        S.st = 'run'; S.dur = 2.9; S.ok = false;
        S.bad = !S.retry && r2() < .22; S.retry = false;
        setStat('run');
      } else if (S.st === 'run') {
        e.bar.setAttribute('width', 0);
        setStat('idle');
        const r = r2();
        if (S.bad) { S.st = 'think'; S.dur = r2(2, 3); S.retry = true; }
        else if (r < .3) { S.st = 'think'; S.dur = r2(1.4, 2.6); }
        else { S.st = 'type'; S.dur = r2(3.5, 6.5); }
        if (S.st === 'type') { S.cur = addLine('code', false); S.prog = 0; }
      } else {
        S.st = 'type'; S.dur = r2(3.5, 6.5);
        S.cur = addLine('code', false); S.prog = 0;
      }
    };

    // cinemática inversa de 2 ossos; o cotovelo cai para baixo/trás
    const armIK = (i, hx, hy) => {
      const sh = SH[i], dx = hx - sh.x, dy = hy - sh.y, len = Math.hypot(dx, dy) || 1;
      const d = clamp(len, Math.abs(sh.a - sh.b) + .5, sh.a + sh.b - .5);
      const ux = dx / len, uy = dy / len;
      const p = (sh.a * sh.a - sh.b * sh.b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, sh.a * sh.a - p * p));
      const ex = sh.x + ux * p - uy * h, ey = sh.y + uy * p + ux * h;
      const px = sh.x + ux * d, py = sh.y + uy * d;
      const path = `M${sh.x},${sh.y}L${ex.toFixed(2)},${ey.toFixed(2)}L${px.toFixed(2)},${py.toFixed(2)}`;
      hands[i].arm.setAttribute('d', path);
      for (const q of hands[i].hi) q.setAttribute('d', path);
      hands[i].hand.setAttribute('transform', `translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${(Math.atan2(py - ey, px - ex) * RAD + 16).toFixed(1)})`);
    };

    const update = (dt, t) => {
      S.t += dt;
      let en = 0;

      if (S.st === 'run') {
        const p = clamp(S.t / 1.7, 0, 1);
        e.bar.setAttribute('width', (40 * p).toFixed(2));
        e.bar.setAttribute('fill', '#84cc16');
        e.spin.setAttribute('transform', `rotate(${((t * 504) % 360).toFixed(0)} 36.6 1.7)`);
        if (S.t >= 1.7 && !S.ok) {
          S.ok = true; S.flash = 1;
          setStat(S.bad ? 'bad' : 'ok');
          e.flash.setAttribute('fill', S.bad ? '#ff9a8a' : '#b6f5d3');
          addLine('out', true, S.bad);
          if (!S.bad && r2() < .6) addLine('out', true);
        }
        if (S.t < .7) en = Math.sin(Math.PI * S.t / .7);    // golpe suave na tecla Enter
      }
      if (S.t >= S.dur) next();

      // intensidade da digitação: rajadas com micro-pausas
      let tgt = S.st === 'type' ? 1 : S.st === 'run' ? .3 : .1;
      if (S.st === 'type') {
        S.nextPause -= dt;
        if (S.nextPause <= 0) { S.pause = r2(.5, 1.3); S.nextPause = r2(2.5, 5.5); }
        if (S.pause > 0) { S.pause -= dt; tgt = .12; }
      }
      const amp = S.amp = damp(S.amp, tgt, 4, dt);
      S.key += dt * (1.5 + .5 * Math.sin(t * .7) + .3 * Math.sin(t * 1.9)) * amp;

      // código sendo digitado
      if (S.cur) {
        S.prog += dt * 10.5 * amp * (.8 + .4 * Math.sin(t * 1.7));
        if (S.prog >= S.cur.total) { reveal(S.cur, S.cur.total); S.cur = addLine('code', false); S.prog = 0; }
        else reveal(S.cur, S.prog);
        const cy = Y0 + S.cur.row * LH;
        cursor.setAttribute('x', (S.cur.x0 + S.prog + .5).toFixed(2));
        cursor.setAttribute('y', (cy - .15).toFixed(2));
        cursor.setAttribute('opacity', (t * 1.6) % 1 < .62 ? 1 : 0);
        hl.setAttribute('y', (cy - .6).toFixed(2));
        hl.setAttribute('opacity', 1);
      } else { cursor.setAttribute('opacity', 0); hl.setAttribute('opacity', 0); }
      S.off = damp(S.off, Math.max(0, S.n - ROWS), 8, dt);
      e.code.setAttribute('transform', `translate(0 ${(-S.off * LH).toFixed(2)})`);

      // mãos e dedos: batidas irregulares, mão acompanha o teclado e levanta nas pausas
      let tapSum = 0;
      for (let i = 0; i < 2; i++) {
        let sum = 0;
        for (let j = 0; j < 3; j++) {
          let tap = Math.pow(Math.max(0, Math.sin(6.2832 * S.key * (1 + .17 * j + .11 * i) + j * 2.1 + i * 1.3)), 3) * amp;
          if (i === 0 && j === 0) tap = Math.min(1, tap + en);
          sum += tap;
          hands[i].fing[j].setAttribute('transform', `rotate(${(tap * 24).toFixed(1)} 7 ${FY[j]})`);
          keys[i * 3 + j].setAttribute('opacity', (tap * .85).toFixed(2));
        }
        tapSum += sum;
        const hx = HB[i].x + Math.sin(t * .9 + i * 2.3) * 3.2 * amp + (i ? 0 : en * 5.5);
        const hy = HB[i].y - (1 - amp) * 2.4 + sum * .35 - (i ? 0 : en * 1.8);
        armIK(i, hx, hy);
      }

      // cabeça: olha a tela, levanta nas pausas, olha o painel quando chega um pacote, segue o cursor
      let ht = 1.1 * amp + .7 * Math.sin(t * .45) + tapSum * .12 + Math.sin(t * 5.2) * .25;
      if (S.st === 'think') ht -= 4.5;
      if (S.st === 'run') ht += .8;
      if (S.glance > 0) { ht -= 5.5; S.glance -= dt; }
      if (S.ptr !== null) ht -= 3.2 * clamp((S.ptr - .3) / .7, 0, 1);
      S.head = damp(S.head, ht, 5, dt);
      e.head.setAttribute('transform', `rotate(${S.head.toFixed(2)} 103 160)`);
      e.torso.setAttribute('transform', `rotate(${(5 + .3 * Math.sin(t * 1.5) + .8 * amp).toFixed(2)} 94 230)`);

      // pé marcando o ritmo, de vez em quando
      const fa = clamp(Math.sin(t * .13) * 2.2, 0, 1);
      e.foot.setAttribute('transform', `rotate(${(-Math.pow(Math.max(0, Math.sin(t * 10.4)), 2) * 3.2 * fa).toFixed(2)} 124 263)`);

      // luz da tela refletida no ambiente
      S.flash = Math.max(0, S.flash - dt * 1.3);
      const act = .5 + .22 * amp + .3 * S.flash;
      e.cone.style.opacity = (.35 + .5 * act).toFixed(2);
      e.glow.style.opacity = (.3 + .4 * act).toFixed(2);
      e.ground.style.opacity = (.22 + .3 * act).toFixed(2);
      e.desk.setAttribute('opacity', (.06 + .16 * act).toFixed(3));
      e.face.setAttribute('opacity', (.05 + .12 * act).toFixed(3));
      e.flash.setAttribute('opacity', (S.flash * .18).toFixed(3));
    };

    setStat('idle');
    return {
      update,
      glance: () => { S.glance = 1.6; S.flash = Math.max(S.flash, .35); e.flash.setAttribute('fill', '#b6f5d3'); },
      look: v => { S.ptr = v; }
    };
  };

  /* ===================================================================
     FLUXO DE DADOS (relógio da cena em ms: não salta quando a cena pausa)
     =================================================================== */
  let nextSend = 2500, flight = null, dev = null, phase = 'run';
  const ping = () => {
    if (!g.ring.animate) return;
    g.ring.animate(
      [{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(8)', opacity: 0 }],
      { duration: 1400, easing: 'ease-out' }
    );
  };
  const packets = now => {
    if (!flight) {
      if (phase !== 'run' || now < nextSend) return;   // não envia enquanto a máquina some/reinicia
      flight = { t0: now, done: false };
      ping();
    }
    const len = g.link.getTotalLength();               // a curva acompanha a antena: recalcula
    let alive = false;
    g.pkts.forEach((p, i) => {
      const k = (now - flight.t0 - i * 220) / 1500;
      if (k <= 0) { alive = true; return; }
      if (k >= 1) {
        p.setAttribute('opacity', 0);
        if (i === 0 && !flight.done) {
          flight.done = true;
          retarget(frac(), now);
          if (dev) dev.glance();
          if (g.border.animate) g.border.animate([{ strokeOpacity: .75 }, { strokeOpacity: .22 }], { duration: 900, easing: 'ease-out' });
        }
        return;
      }
      alive = true;
      const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const pt = g.link.getPointAtLength(e * len);
      p.setAttribute('cx', n1(pt.x)); p.setAttribute('cy', n1(pt.y));
      p.setAttribute('opacity', Math.sin(Math.PI * k).toFixed(2));
    });
    if (!alive) { flight = null; nextSend = now + 5000; }
  };

  /* ---------- vento: a rolagem da página gera uma rajada suave ---------- */
  let gust = 0, lastY = scrollY, amp = 1.4;
  addEventListener('scroll', () => {
    const d = Math.abs(scrollY - lastY); lastY = scrollY;
    gust = Math.min(1, gust + d / 260);
  }, { passive: true });
  const wind = dt => {
    gust = Math.max(0, gust - dt * .5);
    const a = Math.round((1.4 + gust * 1.6) / .15) * .15;   // quantizado: evita recalcular o estilo de ~100 elementos a cada frame
    if (Math.abs(a - amp) > .01) { amp = a; svg.style.setProperty('--amp', a.toFixed(2)); }
  };

  /* ===================================================================
     LAÇO PRINCIPAL
     =================================================================== */
  let wait = 0, last = 0, raf = 0, ema = .0167, low = false, devDt = 0, fn = 0;
  const setFade = on => [g.harv, g.stubble, g.stubLines, g.lane, g.link].forEach(el => el.classList.toggle('ag-off', on));

  const frame = now => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, .1); last = now;
    tt += dt;
    const T = tt * 1000;
    // dispositivos lentos: o programador passa a atualizar em frames alternados
    ema += (dt - ema) * .05;
    if (!low && ema > .032) low = true; else if (low && ema < .022) low = false;

    if (phase === 'run') {
      runT += dt;
      const e = Math.min(1, runT / 1.4), ramp = e * e * (3 - 2 * e);          // arranque suave
      speed = SPEED * ramp * (1 + .06 * Math.sin(tt * .6));
      x -= speed * dt;
      if (x <= X1) { phase = 'fade'; wait = 1.6; setFade(true); }
    } else {
      wait -= dt;
      speed = SPEED * clamp((wait - .5) / 1.1, 0, 1);                        // desacelera enquanto some
      x -= speed * dt;
      if (wait <= 0) {
        x = X0; runT = 0; speed = 0; resetCrops(); setFade(false); phase = 'run';
        retarget(0, T);
      }
    }
    place();
    animateStraw(dt);
    packets(T);
    stepTween(T);
    if (dev) {
      devDt += dt;
      if (!low || (++fn & 1)) { dev.update(devDt, tt); devDt = 0; }
    }
    wind(dt);
  };

  /* ---------- inicialização ---------- */
  buildTrees(); buildTrees2(); buildRows(); buildCrops(); buildFx();
  dev = buildDev();
  render(cur.a, cur.y, cur.p); setBar(cur.p); place();

  if (reduce) {
    x = (X0 + X1) / 2; place();
    const f = target(frac());
    cur = f; render(f.a, f.y, f.p); setBar(f.p);
    if (dev) dev.update(.5, .5);              // pose estática de digitação
    return;
  }

  // o programador reage ao cursor sobre a cena
  if (dev) {
    root.addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect();
      if (r.width) dev.look(clamp((e.clientX - r.left) / r.width, 0, 1));
    }, { passive: true });
    root.addEventListener('pointerleave', () => dev.look(null));
  }

  let visible = true;
  const sync = () => {
    const on = visible && !document.hidden;
    svg.classList.toggle('ag-paused', !on);   // congela as animações CSS fora da tela
    if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; sync(); }, { threshold: 0.05 }).observe(root);
  }
  sync();
})();
