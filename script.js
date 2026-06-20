(() => {
  'use strict';
  const cvs = document.getElementById('space');
  const ctx = cvs.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const C = { void:'#060912', mint:'#4fffc4', sky:'#38c5ff', purple:'#a06bff', peri:'#6c7bff', star:'#e8f0fc' };

  let W=0, H=0, DPR=1, UNIT=0, CX=0, CY=0, small=false;
  let stars=[], motes=[], nebula=[], nodes=[], edges=[], signals=[], flares=[];
  let T=0, last=0, raf=0, running=false, hidden=false;
  let mx=0, my=0, tmx=0, tmy=0, rotY=0, rotX=0, trotY=0, trotX=0;
  let lastFwd=0, lastBack=0, vignette=null;

  const spriteCache = {};
  function glow(hex, size){
    const key = hex + size;
    if (spriteCache[key]) return spriteCache[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); const r = size/2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, hex); grd.addColorStop(0.18, hex); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, size, size);
    spriteCache[key] = c; return c;
  }

  function layout(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; small = W < 760;
    cvs.width = W * DPR; cvs.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W/2; CY = H/2; UNIT = Math.min(W, H) * (small ? 0.30 : 0.32);
    buildStars(); buildMotes(); buildNebula(); buildNet();
    const vg = ctx.createRadialGradient(CX, CY, Math.min(W,H)*0.2, CX, CY, Math.max(W,H)*0.72);
    vg.addColorStop(0, 'rgba(6,9,18,0)'); vg.addColorStop(1, 'rgba(6,9,18,0.85)');
    vignette = vg;
  }
  function buildStars(){
    stars = []; const n = small ? 130 : 230;
    for (let i=0;i<n;i++){
      const z = Math.random();
      stars.push({ x:Math.random(), y:Math.random(), z, s: z>0.86?2:1, a: 0.18 + 0.6*z,
        tw: Math.random()*Math.PI*2, ts: 0.6+Math.random()*1.4, vx:(Math.random()-0.5)*0.004,
        bright: z>0.92, col: Math.random()<0.78 ? C.star : (Math.random()<0.5?C.sky:C.purple) });
    }
  }
  function buildMotes(){
    motes = []; if (small) return;
    for (let i=0;i<6;i++) motes.push({ x:Math.random(), y:Math.random(), z:0.8+Math.random()*0.6,
      r: 26+Math.random()*40, a: 0.05+Math.random()*0.08, col:[C.peri,C.sky,C.purple][i%3],
      vx:(Math.random()-0.5)*0.01, vy:(Math.random()-0.5)*0.006 });
  }
  function buildNebula(){
    nebula = [
      { x:0.22, y:0.30, r:0.55, col:[160,107,255], a:0.16, vx:0.0006, vy:0.0003 },
      { x:0.80, y:0.66, r:0.62, col:[56,197,255], a:0.13, vx:-0.0005, vy:-0.0004 },
      { x:0.55, y:0.85, r:0.50, col:[79,255,196], a:0.08, vx:0.0004, vy:0.0002 },
      { x:0.92, y:0.12, r:0.42, col:[108,123,255], a:0.10, vx:-0.0003, vy:0.0005 }
    ];
  }
  function buildNet(){
    const sizes = small ? [4,6,8,6,4] : [5,8,11,8,5];
    nodes = []; edges = []; const L = sizes.length;
    sizes.forEach((n, li) => {
      const xN = (li/(L-1) - 0.5) * 2.4;
      for (let j=0;j<n;j++){
        const yN = n>1 ? (j/(n-1) - 0.5) * 1.7 : 0;
        nodes.push({ bx:xN, by:yN + (Math.random()-0.5)*0.12, bz:(Math.random()-0.5)*1.0,
          layer:li, size: small?2.4:2.8, act:0, tw:Math.random()*Math.PI*2, out:[], inn:[], sx:0, sy:0, sc:1, da:1 });
      }
    });
    let off = 0;
    for (let li=0; li<L-1; li++){
      const a0=off, a1=off+sizes[li], b1=a1+sizes[li+1];
      for (let a=a0;a<a1;a++) for (let b=a1;b<b1;b++){ if (small && Math.random()<0.30) continue; edges.push({ a, b }); }
      off += sizes[li];
    }
    nodes.forEach(n => { n.out=[]; n.inn=[]; });
    edges.forEach((e, ei) => { nodes[e.a].out.push(ei); nodes[e.b].inn.push(ei); });
    signals = [];
  }
  function project(){
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sxx = Math.sin(rotX);
    const focal = 3.4;
    for (const n of nodes){
      let x = n.bx, y = n.by, z = n.bz;
      let x1 = x*cy + z*sy, z1 = -x*sy + z*cy;
      let y2 = y*cx - z1*sxx, z2 = y*sxx + z1*cx;
      const sc = focal / (focal - z2);
      n.sx = CX + x1*sc*UNIT + mx*22*(0.6 + z2*0.2);
      n.sy = CY + y2*sc*UNIT + my*18*(0.6 + z2*0.2);
      n.sc = sc; n.da = Math.max(0.25, Math.min(1, 0.55 + z2*0.5));
    }
  }
  function spawnForward(){
    const first = nodes.filter(n => n.layer === 0);
    for (const n of first){ n.act = 1;
      for (const ei of n.out) if (Math.random() < 0.8 && signals.length < (small?50:84))
        signals.push({ e:ei, t:0, sp:0.45+Math.random()*0.35, dir:1, gen:0, col:C.mint }); }
  }
  function spawnBack(){
    const lastL = nodes[nodes.length-1].layer;
    for (const n of nodes){ if (n.layer !== lastL) continue;
      if (Math.random() < 0.7){ n.act = 1;
        for (const ei of n.inn) if (Math.random() < 0.55 && signals.length < (small?50:84))
          signals.push({ e:ei, t:0, sp:0.5+Math.random()*0.3, dir:-1, gen:0, col:C.purple }); } }
  }
  function burst(px, py){
    let best=null, bd=1e9;
    for (const n of nodes){ const dx=n.sx-px, dy=n.sy-py, d=dx*dx+dy*dy; if (d<bd){ bd=d; best=n; } }
    flares.push({ x:px, y:py, r:0, mr: small?90:140, life:1, col:C.mint });
    if (!best) return; best.act = 1.4;
    for (const ei of best.out) if (signals.length<(small?50:84)) signals.push({ e:ei, t:0, sp:0.6+Math.random()*0.3, dir:1, gen:0, col:C.mint });
    for (const ei of best.inn) if (signals.length<(small?50:84)) signals.push({ e:ei, t:0, sp:0.6+Math.random()*0.3, dir:-1, gen:0, col:C.sky });
    for (const n of nodes){ const dx=n.sx-px, dy=n.sy-py; if (dx*dx+dy*dy < (small?70:100)**2) n.act = Math.min(1.4, n.act+0.7); }
  }
  function step(dt){
    const lastL = nodes[nodes.length-1].layer;
    mx += (tmx-mx)*0.05; my += (tmy-my)*0.05;
    trotY = tmx*0.45 + Math.sin(T*0.00018)*0.14; trotX = -tmy*0.28;
    rotY += (trotY-rotY)*0.04; rotX += (trotX-rotX)*0.04;
    for (let i=signals.length-1;i>=0;i--){
      const s = signals[i]; s.t += s.sp*dt;
      if (s.t >= 1){
        const e = edges[s.e]; const tg = s.dir===1 ? nodes[e.b] : nodes[e.a];
        tg.act = Math.min(1.5, tg.act + 0.9);
        flares.push({ x:tg.sx, y:tg.sy, r:0, mr: small?26:36, life:1, col:s.col });
        if (s.gen < 4){
          if (s.dir===1 && tg.layer < lastL){ for (const ei of tg.out) if (Math.random()<0.6 && signals.length<(small?50:84)) signals.push({ e:ei, t:0, sp:s.sp*(0.9+Math.random()*0.2), dir:1, gen:s.gen+1, col:C.mint }); }
          else if (s.dir===-1 && tg.layer > 0){ for (const ei of tg.inn) if (Math.random()<0.5 && signals.length<(small?50:84)) signals.push({ e:ei, t:0, sp:s.sp*(0.9+Math.random()*0.2), dir:-1, gen:s.gen+1, col:C.purple }); }
        }
        signals.splice(i,1);
      }
    }
    for (const n of nodes) n.act *= 0.93;
    for (let i=flares.length-1;i>=0;i--){ const f = flares[i]; f.life -= dt*1.6; f.r += (f.mr - f.r)*dt*4; if (f.life <= 0) flares.splice(i,1); }
    for (const s of stars){ s.x += s.vx*dt*0.4; if (s.x>1) s.x-=1; if (s.x<0) s.x+=1; s.tw += s.ts*dt; }
    for (const m of motes){ m.x += m.vx*dt*0.4; m.y += m.vy*dt*0.4; if (m.x>1.1) m.x-=1.2; if (m.x<-0.1) m.x+=1.2; if (m.y>1.1) m.y-=1.2; if (m.y<-0.1) m.y+=1.2; }
    for (const nb of nebula){ nb.x += nb.vx*dt*0.3; nb.y += nb.vy*dt*0.3; }
    T += dt*1000;
  }
  function draw(){
    ctx.clearRect(0,0,W,H); ctx.fillStyle = C.void; ctx.fillRect(0,0,W,H);
    for (const nb of nebula){
      const cxp = nb.x*W + mx*30*nb.r, cyp = nb.y*H + my*24*nb.r, rad = nb.r*Math.max(W,H);
      const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, rad);
      g.addColorStop(0, `rgba(${nb.col[0]},${nb.col[1]},${nb.col[2]},${nb.a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
    for (const s of stars){
      const px = s.x*W + mx*40*s.z, py = s.y*H + my*30*s.z;
      const a = s.a * (0.55 + 0.45*Math.sin(s.tw));
      if (s.bright){ const sp = glow(s.col, 26); ctx.globalAlpha = a*0.9; ctx.drawImage(sp, px-13, py-13, 26, 26); ctx.globalAlpha = 1; }
      ctx.globalAlpha = a; ctx.fillStyle = s.col; ctx.fillRect(px, py, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    project();
    ctx.lineWidth = 1;
    for (const e of edges){
      const a = nodes[e.a], b = nodes[e.b]; const act = Math.max(a.act, b.act);
      const al = (0.04 + act*0.28) * Math.min(a.da, b.da); if (al < 0.012) continue;
      ctx.strokeStyle = `rgba(108,123,255,${al})`; ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
    const order = nodes.slice().sort((p,q)=>p.sc-q.sc);
    for (const n of order){
      const tw = 0.7 + 0.3*Math.sin(n.tw + T*0.001); const baseR = n.size * n.sc; const hr = baseR * (3.4 + n.act*4);
      ctx.globalAlpha = (0.30 + 0.45*n.da) * tw;
      ctx.drawImage(glow(C.sky, 64), n.sx-hr, n.sy-hr, hr*2, hr*2);
      if (n.act > 0.12){ ctx.globalAlpha = Math.min(1, n.act); const hr2 = baseR*(4+n.act*5); ctx.drawImage(glow(C.mint, 64), n.sx-hr2, n.sy-hr2, hr2*2, hr2*2); }
      ctx.globalAlpha = n.da; ctx.fillStyle = n.act>0.4 ? '#ffffff' : C.star;
      ctx.beginPath(); ctx.arc(n.sx, n.sy, baseR*(0.55+n.act*0.4), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const s of signals){
      const e = edges[s.e]; const from = s.dir===1 ? nodes[e.a] : nodes[e.b]; const to = s.dir===1 ? nodes[e.b] : nodes[e.a];
      const x = from.sx + (to.sx-from.sx)*s.t, y = from.sy + (to.sy-from.sy)*s.t;
      const t2 = Math.max(0, s.t-0.16); const tx = from.sx + (to.sx-from.sx)*t2, ty = from.sy + (to.sy-from.sy)*t2;
      ctx.strokeStyle = s.col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.drawImage(glow(s.col, 30), x-9, y-9, 18, 18);
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const m of motes){ const px = m.x*W + mx*70*m.z, py = m.y*H + my*55*m.z; ctx.globalAlpha = m.a; ctx.drawImage(glow(m.col, 128), px-m.r, py-m.r, m.r*2, m.r*2); }
    ctx.globalAlpha = 1;
    for (const f of flares){
      ctx.globalAlpha = Math.max(0, f.life)*0.7; ctx.strokeStyle = f.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = Math.max(0, f.life)*0.5; const gr=f.r*0.5+8; ctx.drawImage(glow(f.col, 64), f.x-gr, f.y-gr, gr*2, gr*2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = vignette; ctx.fillRect(0,0,W,H);
  }
  function frame(now){
    raf = requestAnimationFrame(frame);
    if (hidden){ last = now; return; }
    let dt = (now - last)/1000; last = now; if (dt > 0.05) dt = 0.05;
    if (now - lastFwd > 1700){ lastFwd = now; spawnForward(); }
    if (now - lastBack > 5400){ lastBack = now; spawnBack(); }
    step(dt); draw();
  }
  function start(){ if (running) return; running = true; last = performance.now(); lastFwd = last; lastBack = last - 2600; spawnForward(); raf = requestAnimationFrame(frame); }

  addEventListener('resize', () => { layout(); if (reduce){ project(); draw(); } }, { passive:true });
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
  if (fine) addEventListener('mousemove', e => { tmx = (e.clientX/innerWidth-0.5)*2; tmy = (e.clientY/innerHeight-0.5)*2; }, { passive:true });
  addEventListener('click', e => { if (e.target.closest('a, nav, .panel, .card')) return; burst(e.clientX, e.clientY); });

  layout();
  if (reduce){ spawnForward(); for (let k=0;k<3;k++) step(0.05); project(); draw(); } else { start(); }
})();

(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('nav');
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const ids = ['about','projects','contact'];
  let ticking = false;
  function onScroll(){
    ticking = false;
    if (nav) nav.classList.toggle('scrolled', scrollY > 20);
    let cur = '';
    for (const id of ids){ const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight*0.45) cur = id; }
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, { passive:true });

  const rv = Array.from(document.querySelectorAll('.rv'));
  if (reduce){ rv.forEach(el => el.classList.add('in')); }
  else {
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold:0.12, rootMargin:'0px 0px -6% 0px' });
    rv.forEach(el => io.observe(el));
  }
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  onScroll();
})();