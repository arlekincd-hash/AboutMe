/* ============================================================
   script.js  (часть 1/2)
   Денис Сафронов — портфолио
   Меню · Модалка · Карусель · 3D-tilt · Shine · Parallax
   Система «вайба»: leaves / spheres / stars+clouds / constellation
   ============================================================ */

'use strict';

/* ============================================================
   🍔 МЕНЮ (бургер)
   ============================================================ */
const navLinks = document.getElementById('navLinks');
const burger   = document.querySelector('.burger');

function toggleMenu(){
  navLinks.classList.toggle('open');
  burger.classList.toggle('open');
}
function closeMenu(){
  navLinks.classList.remove('open');
  burger.classList.remove('open');
}
window.toggleMenu = toggleMenu;
window.closeMenu  = closeMenu;

document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){ closeMenu(); closeModal(); }
});

/* ============================================================
   🔍 МОДАЛКА (просмотр фото)
   ============================================================ */
const modal    = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');

function openModal(src, alt=''){
  modalImg.src = src;
  modalImg.alt = alt;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
window.openModal  = openModal;
window.closeModal = closeModal;

/* ============================================================
   🎠 КАРУСЕЛЬ + 3D-TILT
   рендер карточек делает works.js -> renderWorks(track)
   ============================================================ */
/* ============================================================
   🎠 КАРУСЕЛЬ (бесконечная) + клики + 3D-tilt
   ============================================================ */
(function initCarousel(){
  const track = document.getElementById('carTrack');
  if(!track) return;

  // рендерим карточки из works.js
  if(typeof renderWorks === 'function'){
    renderWorks(track);
  } else if(typeof WORKS !== 'undefined' && Array.isArray(WORKS) && !track.children.length){
    track.innerHTML = WORKS.map(w=>{
      const isVideo = w.type === 'video';
      const badgeClass = isVideo ? 'badge-video' : 'badge-photo';
      const badge = w.badge ? `<span class="work-badge ${badgeClass}">${w.badge}</span>` : '';
      const media = isVideo
        ? `<div class="work-media"><img src="${w.img}" alt="${w.title||''}"></div>
           <div class="work-play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>`
        : `<div class="work-media"><img src="${w.img}" alt="${w.title||''}"></div>`;
      return `
        <article class="work-card" data-type="${w.type}"
                 ${!isVideo ? `data-full="${w.img}"` : ''}
                 ${w.link   ? `data-link="${w.link}"` : ''}
                 data-title="${w.title||''}">
          <div class="work-inner">
            ${badge}
            ${media}
            <div class="work-body">
              <h3>${w.title||''}</h3>
              <p>${w.text||''}</p>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  const isFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // ========================================================
  // 🎠 БЕСКОНЕЧНАЯ АВТО-КАРУСЕЛЬ
  // ========================================================
  if(!track.children.length) return;

  // 1) дублируем карточки для бесшовной ленты
  const originals = Array.from(track.children);
  originals.forEach(node=>{
    const clone = node.cloneNode(true);
    clone.setAttribute('data-clone','1');
    track.appendChild(clone);
  });

  let offset = 0;
  let speed  = 0.5;
  let paused = false;
  let dragging = false;
  let moved = false;               // был ли реальный сдвиг (чтобы отличать клик от drag)
  let startX = 0, startOffset = 0;
  let manualPush = 0;

  function halfWidth(){ return track.scrollWidth / 2; }
  function apply(){ track.style.transform = `translate3d(${-offset}px,0,0)`; }

  function loop(){
    const half = halfWidth();
    if(!paused && !dragging) offset += speed;
    if(manualPush !== 0){
      offset += manualPush;
      manualPush *= 0.85;
      if(Math.abs(manualPush) < 0.3) manualPush = 0;
    }
    if(offset >= half) offset -= half;
    if(offset < 0)     offset += half;
    apply();
    requestAnimationFrame(loop);
  }

  // 2) пауза при наведении
  track.addEventListener('mouseenter', ()=> paused = true);
  track.addEventListener('mouseleave', ()=> paused = false);

  // 3) перетаскивание
  function down(x){ dragging = true; moved = false; startX = x; startOffset = offset; track.style.cursor='grabbing'; }
  function move(x){ if(!dragging) return; if(Math.abs(x-startX) > 4) moved = true; offset = startOffset - (x - startX); }
  function up(){ dragging = false; track.style.cursor='grab'; }

  track.addEventListener('mousedown', e=>{ e.preventDefault(); down(e.clientX); });
  window.addEventListener('mousemove', e=>{ if(dragging) move(e.clientX); });
  window.addEventListener('mouseup', up);

  track.addEventListener('touchstart', e=>{ paused=true; down(e.touches[0].clientX); }, {passive:true});
  track.addEventListener('touchmove',  e=>{ move(e.touches[0].clientX); }, {passive:true});
  track.addEventListener('touchend',   ()=>{ up(); paused=false; });

  // 4) кнопки перемотки (id из твоей вёрстки)
  const prevBtn = document.getElementById('carPrev');
  const nextBtn = document.getElementById('carNext');
  if(prevBtn) prevBtn.addEventListener('click', ()=> manualPush -= 80);
  if(nextBtn) nextBtn.addEventListener('click', ()=> manualPush += 80);

  // ========================================================
  // 👆 КЛИК ПО КАРТОЧКЕ — открыть фото / видео
  // ========================================================
  track.addEventListener('click', e=>{
    if(moved) return;                       // это был drag, не клик
    const card = e.target.closest('.work-card');
    if(!card) return;
    const type = card.dataset.type;
    if(type === 'video' && card.dataset.link){
      window.open(card.dataset.link, '_blank', 'noopener');
    } else if(card.dataset.full){
      openModal(card.dataset.full, card.dataset.title || '');
    }
  });

  // ========================================================
  // 🌟 3D-tilt (только на десктопе с мышью)
  // ========================================================
  if(isFine){
    Array.from(track.children).forEach(card=>{
      const inner = card.querySelector('.work-inner') || card;
      card.addEventListener('mousemove', e=>{
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width  - 0.5;
        const py = (e.clientY - r.top )/r.height - 0.5;
        inner.style.transform = `rotateY(${px*10}deg) rotateX(${-py*10}deg)`;
      });
      card.addEventListener('mouseleave', ()=>{
        inner.style.transform = 'rotateY(0) rotateX(0)';
      });
    });
  }

  apply();
  requestAnimationFrame(loop);
})();

/* ============================================================
   ✨ SHINE на карточках направлений + 🌅 PARALLAX имени
   ============================================================ */
(function initShineAndParallax(){
  const isFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // shine-подсветка следует за курсором внутри .dir
  document.querySelectorAll('.dir').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left)+'px');
      card.style.setProperty('--my', (e.clientY - r.top )+'px');
    });
  });

  if(!isFine) return;
  const name = document.querySelector('.name');
  const role = document.querySelector('.role');
  if(!name) return;

  window.addEventListener('mousemove', e=>{
    const cx = (e.clientX / window.innerWidth  - 0.5);
    const cy = (e.clientY / window.innerHeight - 0.5);
    name.style.transform = `translate(${cx*14}px, ${cy*8}px)`;
    if(role) role.style.transform = `translate(${cx*7}px, ${cy*4}px)`;
  });
})();

/* ============================================================
   🌈 СИСТЕМА «ВАЙБА» — общий движок
   ============================================================
   Один canvas #leaves. Режимы:
     leaves        — листья (отталкиваются) + лепестки (притягиваются)
     spheres       — светящиеся сферы (разбегаются от курсора)
     stars         — звёзды (притягиваются, ярче) + облака (отталкиваются)
     constellation — сеть-организм (точки тянутся к курсору)
   Автостарт: по времени суток; далее — выбор юзера (localStorage).
============================================================ */
const Vibe = (()=>{
  const canvas = document.getElementById('leaves');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let W=0, H=0, dpr=1;
  let rafId = null;
  let running = false;
  let current = null;          // имя текущего режима
  let engine  = null;          // {init,draw,resize} активного режима
  let enabled = true;          // тумблер power

  // указатель мыши (в css-пикселях)
  const mouse = { x:-9999, y:-9999, active:false };

  const PREF_KEY  = 'vibe.mode';
  const POWER_KEY = 'vibe.power';

  function resize(){
    if(!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(engine && engine.resize) engine.resize(W,H);
  }

  function clear(){ if(ctx) ctx.clearRect(0,0,W,H); }

  function loop(){
    if(!running || !engine){ return; }
    engine.draw(ctx, W, H, mouse);
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    if(running || !engine || !enabled) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }
  function stop(){
    running = false;
    if(rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // словарь движков заполняется ниже (Vibe.register)
  const engines = {};
  function register(name, factory){ engines[name] = factory; }

  function setMode(name, save=true){
    if(!canvas || !engines[name]) return;
    stop();
    clear();
    current = name;
    engine  = engines[name]();
    resize();
    if(engine.init) engine.init(W,H);
    if(save){ try{ localStorage.setItem(PREF_KEY, name); }catch(e){} }
    // подсветка активной кнопки
    document.querySelectorAll('.vibe-btn[data-mode]').forEach(b=>
      b.classList.toggle('active', b.dataset.mode === name));
    if(enabled) start();
  }

  function setEnabled(on, save=true){
    enabled = on;
    if(save){ try{ localStorage.setItem(POWER_KEY, on ? '1':'0'); }catch(e){} }
    const powerBtn = document.getElementById('vibePower');
    if(powerBtn) powerBtn.classList.toggle('off', !on);
    if(on){ start(); }
    else  { stop(); clear(); }
  }

  // выбор режима по времени суток
  function modeByTime(){
    const h = new Date().getHours();
    if(h >= 6  && h < 11) return 'leaves';        // утро
    if(h >= 11 && h < 17) return 'spheres';       // день
    if(h >= 17 && h < 21) return 'constellation'; // вечер
    return 'stars';                               // ночь
  }

  /* мышь / тач */
  if(canvas){
    window.addEventListener('mousemove', e=>{
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, {passive:true});
    window.addEventListener('mouseout', ()=>{ mouse.active=false; mouse.x=mouse.y=-9999; });
    window.addEventListener('touchmove', e=>{
      const t=e.touches[0]; if(!t) return;
      mouse.x=t.clientX; mouse.y=t.clientY; mouse.active=true;
    }, {passive:true});
    window.addEventListener('touchend', ()=>{ mouse.active=false; });
    window.addEventListener('resize', resize);
    // пауза, когда вкладка скрыта
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) stop();
      else if(enabled && engine) start();
    });
  }

  return { register, setMode, setEnabled, modeByTime,
           get current(){return current;},
           get enabled(){return enabled;},
           _keys:{PREF_KEY, POWER_KEY} };
})();

/* ============================================================
   🍃 ДВИЖОК: LEAVES
   листья отталкиваются от курсора, лепестки — притягиваются
   (логика перенесена из original)
   ============================================================ */
Vibe.register('leaves', ()=>{
  let W=0,H=0;
  let items=[];
  const PALETTE_LEAF   = ['#2f6a52','#6fb694','#3f8a63','#568f4f'];
  const PALETTE_PETAL  = ['#c96f4a','#db8a63','#d3c2a4','#e0a978'];

  function rnd(a,b){ return a + Math.random()*(b-a); }

  function makeItem(kind){
    const isLeaf = kind === 'leaf';
    return {
      kind,
      x: rnd(0,W),
      y: rnd(-H, H),
      size: isLeaf ? rnd(9,18) : rnd(5,10),
      rot: rnd(0, Math.PI*2),
      vr:  rnd(-0.02,0.02),
      vx:  rnd(-0.3,0.3),
      vy:  rnd(0.35,1.1),
      sway: rnd(0.4,1.2),
      phase: rnd(0,Math.PI*2),
      color: isLeaf
        ? PALETTE_LEAF[(Math.random()*PALETTE_LEAF.length)|0]
        : PALETTE_PETAL[(Math.random()*PALETTE_PETAL.length)|0],
      op: rnd(.5,.9)
    };
  }

  function init(w,h){
    W=w; H=h;
    const count = Math.round(Math.min(70, Math.max(28, W/26)));
    items = [];
    for(let i=0;i<count;i++){
      items.push(makeItem(Math.random()<0.62 ? 'leaf' : 'petal'));
    }
  }
  function resize(w,h){ W=w; H=h; }

  function drawLeaf(ctx,it){
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    ctx.globalAlpha = it.op;
    ctx.fillStyle = it.color;
    ctx.beginPath();
    const s = it.size;
    ctx.moveTo(0,-s);
    ctx.quadraticCurveTo( s*0.9, 0, 0, s);
    ctx.quadraticCurveTo(-s*0.9, 0, 0,-s);
    ctx.fill();
    // прожилка
    ctx.globalAlpha = it.op*0.5;
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(0,s); ctx.stroke();
    ctx.restore();
  }
  function drawPetal(ctx,it){
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    ctx.globalAlpha = it.op;
    ctx.fillStyle = it.color;
    ctx.beginPath();
    const s = it.size;
    ctx.ellipse(0,0, s, s*0.55, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function draw(ctx,w,h,mouse){
    W=w; H=h;
    ctx.clearRect(0,0,W,H);
    const t = performance.now()*0.001;

    for(const it of items){
      // базовое падение + покачивание
      it.x += it.vx + Math.sin(t*it.sway + it.phase)*0.4;
      it.y += it.vy;
      it.rot += it.vr;

      // взаимодействие с курсором
      if(mouse.active){
        const dx = it.x - mouse.x;
        const dy = it.y - mouse.y;
        const d2 = dx*dx + dy*dy;
        const R  = 140;
        if(d2 < R*R){
          const d = Math.sqrt(d2) || 1;
          const force = (R - d)/R;
          if(it.kind === 'leaf'){
            // отталкивание
            it.x += (dx/d) * force * 6;
            it.y += (dy/d) * force * 6;
          } else {
            // лепестки — притягиваются
            it.x -= (dx/d) * force * 3.2;
            it.y -= (dy/d) * force * 3.2;
          }
        }
      }

      // респавн сверху
      if(it.y - it.size > H){ it.y = -it.size*2; it.x = rnd(0,W); }
      if(it.x < -30) it.x = W+20;
      if(it.x > W+30) it.x = -20;

      if(it.kind === 'leaf') drawLeaf(ctx,it);
      else                   drawPetal(ctx,it);
    }
    ctx.globalAlpha = 1;
  }

  return { init, resize, draw };
});

/* ============================================================
   🔮 ДВИЖОК: SPHERES
   светящиеся сферы дрейфуют; у курсора — разбегаются
   ============================================================ */
Vibe.register('spheres', ()=>{
  let W=0,H=0;
  let orbs=[];
  const COLORS = ['#c96f4a','#6fb694','#8fc4dc','#db8a63','#2f6a52'];

  function rnd(a,b){ return a + Math.random()*(b-a); }

  function make(){
    return {
      x: rnd(0,W), y: rnd(0,H),
      r: rnd(18,54),
      vx: rnd(-0.25,0.25),
      vy: rnd(-0.25,0.25),
      color: COLORS[(Math.random()*COLORS.length)|0],
      op: rnd(.25,.6)
    };
  }
  function init(w,h){
    W=w; H=h;
    const count = Math.round(Math.min(26, Math.max(10, W/70)));
    orbs = [];
    for(let i=0;i<count;i++) orbs.push(make());
  }
  function resize(w,h){ W=w; H=h; }

  function draw(ctx,w,h,mouse){
    W=w; H=h;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    for(const o of orbs){
      o.x += o.vx; o.y += o.vy;

      // разбегание от курсора
      if(mouse.active){
        const dx = o.x - mouse.x, dy = o.y - mouse.y;
        const d2 = dx*dx+dy*dy;
        const R = 200;
        if(d2 < R*R){
          const d = Math.sqrt(d2)||1;
          const f = (R-d)/R;
          o.x += (dx/d)*f*4;
          o.y += (dy/d)*f*4;
        }
      }

      // мягкие стенки
      if(o.x < -o.r) o.x = W+o.r;
      if(o.x > W+o.r) o.x = -o.r;
      if(o.y < -o.r) o.y = H+o.r;
      if(o.y > H+o.r) o.y = -o.r;

      const g = ctx.createRadialGradient(o.x,o.y,0, o.x,o.y,o.r);
      g.addColorStop(0, hexA(o.color, o.op));
      g.addColorStop(1, hexA(o.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // helper: hex + alpha -> rgba
  function hexA(hex, a){
    const n = parseInt(hex.slice(1),16);
    const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    return `rgba(${r},${g},${b},${a})`;
  }

  return { init, resize, draw };
});

/* ==== КОНЕЦ ЧАСТИ 1/2 — продолжение (stars+clouds, constellation, запуск) в следующем сообщении ==== */
/* ============================================================
   script.js  (часть 2/2)  — продолжение
   ============================================================ */

/* ============================================================
   ⭐ ДВИЖОК: STARS + CLOUDS
   звёзды: притягиваются к курсору и светят ярче
   облака: полупрозрачные, отталкиваются от курсора
   ============================================================ */
Vibe.register('stars', ()=>{
  let W=0,H=0;
  let stars=[];
  let clouds=[];

  function rnd(a,b){ return a + Math.random()*(b-a); }

  function makeStar(){
    return {
      x: rnd(0,W), y: rnd(0,H),
      bx:0, by:0,
      r: rnd(0.6,1.9),
      base: rnd(.25,.7),
      tw: rnd(0.5,2),
      phase: rnd(0,Math.PI*2),
      vx:0, vy:0,
      color: Math.random()<0.15 ? '#8fc4dc' : (Math.random()<0.15 ? '#db8a63' : '#ffffff')
    };
  }
  function makeCloud(){
    return {
      x: rnd(0,W), y: rnd(0,H),
      r: rnd(90,220),
      vx: rnd(-0.12,0.12),
      vy: rnd(-0.06,0.06),
      op: rnd(.05,.12)
    };
  }

  function init(w,h){
    W=w; H=h;
    const sCount = Math.round(Math.min(220, Math.max(90, W/8)));
    stars = [];
    for(let i=0;i<sCount;i++){
      const s = makeStar();
      s.bx = s.x; s.by = s.y;
      stars.push(s);
    }
    const cCount = Math.round(Math.min(7, Math.max(3, W/420)));
    clouds = [];
    for(let i=0;i<cCount;i++) clouds.push(makeCloud());
  }
  function resize(w,h){
    W=w; H=h;
    for(const s of stars){
      if(s.bx>W) s.bx=rnd(0,W);
      if(s.by>H) s.by=rnd(0,H);
    }
  }

  function hexA(hex,a){
    const n=parseInt(hex.slice(1),16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }

  function draw(ctx,w,h,mouse){
    W=w; H=h;
    ctx.clearRect(0,0,W,H);
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'rgba(8,14,20,.35)');
    bg.addColorStop(1,'rgba(10,20,16,.2)');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    const t = performance.now()*0.001;

    /* ---- ОБЛАКА (под звёздами) ---- */
    for(const c of clouds){
      c.x += c.vx; c.y += c.vy;
      if(mouse.active){
        const dx = c.x - mouse.x, dy = c.y - mouse.y;
        const d2 = dx*dx+dy*dy;
        const R = c.r + 120;
        if(d2 < R*R){
          const d = Math.sqrt(d2)||1;
          const f = (R-d)/R;
          c.x += (dx/d)*f*2.4;
          c.y += (dy/d)*f*2.4;
        }
      }
      if(c.x < -c.r) c.x = W+c.r;
      if(c.x > W+c.r) c.x = -c.r;
      if(c.y < -c.r) c.y = H+c.r;
      if(c.y > H+c.r) c.y = -c.r;

      const g = ctx.createRadialGradient(c.x,c.y,0, c.x,c.y,c.r);
      g.addColorStop(0, `rgba(200,220,235,${c.op})`);
      g.addColorStop(1, `rgba(200,220,235,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
      ctx.fill();
    }

    /* ---- ЗВЁЗДЫ (поверх облаков) ---- */
    ctx.globalCompositeOperation = 'lighter';
    for(const s of stars){
      let bright = s.base + Math.sin(t*s.tw + s.phase)*0.2;

      if(mouse.active){
        const dx = mouse.x - s.x, dy = mouse.y - s.y;
        const d2 = dx*dx+dy*dy;
        const R = 170;
        if(d2 < R*R){
          const d = Math.sqrt(d2)||1;
          const f = (R-d)/R;
          s.vx += (dx/d)*f*0.35;
          s.vy += (dy/d)*f*0.35;
          bright += f*0.9;
        }
      }

      s.vx += (s.bx - s.x)*0.008;
      s.vy += (s.by - s.y)*0.008;
      s.vx *= 0.90;
      s.vy *= 0.90;
      s.x  += s.vx;
      s.y  += s.vy;

      bright = Math.max(0, Math.min(1.4, bright));
      const rr = s.r * (1 + Math.min(bright,1)*0.6);

      ctx.fillStyle = hexA(s.color, Math.min(1, bright));
      ctx.beginPath();
      ctx.arc(s.x, s.y, rr, 0, Math.PI*2);
      ctx.fill();

      // ореол у ярких звёзд
      if(bright > 0.7){
        const g = ctx.createRadialGradient(s.x,s.y,0, s.x,s.y, rr*4);
        g.addColorStop(0, hexA(s.color, (bright-0.7)*0.5));
        g.addColorStop(1, hexA(s.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x,s.y, rr*4, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return { init, resize, draw };
});

/* ============================================================
   🌌 ДВИЖОК: CONSTELLATION (сеть-организм)
   точки дрейфуют и соединяются линиями;
   рядом с курсором — тянутся к нему и связей больше
   (логика восстановлена из сеть.txt)
   ============================================================ */
Vibe.register('constellation', ()=>{
  let W=0,H=0;
  let pts=[];
  const LINK = 130;      // радиус связи между точками
  const MOUSE_R = 190;   // радиус влияния курсора

  function rnd(a,b){ return a + Math.random()*(b-a); }

  function make(){
    return {
      x: rnd(0,W), y: rnd(0,H),
      vx: rnd(-0.35,0.35),
      vy: rnd(-0.35,0.35),
      r: rnd(1.2,2.6)
    };
  }
  function init(w,h){
    W=w; H=h;
    const count = Math.round(Math.min(120, Math.max(45, W/16)));
    pts = [];
    for(let i=0;i<count;i++) pts.push(make());
  }
  function resize(w,h){ W=w; H=h; }

  function draw(ctx,w,h,mouse){
    W=w; H=h;
    ctx.clearRect(0,0,W,H);

    // движение точек
    for(const p of pts){
      p.x += p.vx; p.y += p.vy;

      // притяжение к курсору
      if(mouse.active){
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d2 = dx*dx+dy*dy;
        if(d2 < MOUSE_R*MOUSE_R){
          const d = Math.sqrt(d2)||1;
          const f = (MOUSE_R-d)/MOUSE_R;
          p.vx += (dx/d)*f*0.06;
          p.vy += (dy/d)*f*0.06;
        }
      }
      // лёгкое ограничение скорости
      p.vx = Math.max(-1.2, Math.min(1.2, p.vx));
      p.vy = Math.max(-1.2, Math.min(1.2, p.vy));

      // отражение от краёв
      if(p.x < 0){ p.x=0; p.vx*=-1; }
      if(p.x > W){ p.x=W; p.vx*=-1; }
      if(p.y < 0){ p.y=0; p.vy*=-1; }
      if(p.y > H){ p.y=H; p.vy*=-1; }
    }

    // связи между точками
    for(let i=0;i<pts.length;i++){
      const a = pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b = pts[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d2=dx*dx+dy*dy;
        if(d2 < LINK*LINK){
          const alpha = (1 - Math.sqrt(d2)/LINK) * 0.5;
          ctx.strokeStyle = `rgba(111,182,148,${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }

    // связи с курсором
    if(mouse.active){
      for(const p of pts){
        const dx=p.x-mouse.x, dy=p.y-mouse.y;
        const d2=dx*dx+dy*dy;
        if(d2 < MOUSE_R*MOUSE_R){
          const alpha = (1 - Math.sqrt(d2)/MOUSE_R) * 0.6;
          ctx.strokeStyle = `rgba(224,139,99,${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(mouse.x,mouse.y);
          ctx.stroke();
        }
      }
    }

    // сами точки
    ctx.fillStyle = '#d6e5da';
    for(const p of pts){
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  return { init, resize, draw };
});

/* ============================================================
   🎛️ ПОДКЛЮЧЕНИЕ КНОПОК + АВТОЗАПУСК
   ============================================================ */
(function initVibeUI(){
  const { PREF_KEY, POWER_KEY } = Vibe._keys;

  // кнопки выбора режима
  document.querySelectorAll('.vibe-btn[data-mode]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      Vibe.setEnabled(true);           // выбор режима включает эффект
      Vibe.setMode(btn.dataset.mode);
    });
  });

  // тумблер вкл/выкл
  const powerBtn = document.getElementById('vibePower');
  if(powerBtn){
    powerBtn.addEventListener('click', ()=>{
      Vibe.setEnabled(!Vibe.enabled);
    });
  }

  // читаем сохранённые настройки
  let savedMode = null, savedPower = null;
  try{
    savedMode  = localStorage.getItem(PREF_KEY);
    savedPower = localStorage.getItem(POWER_KEY);
  }catch(e){}

  const mode  = savedMode || Vibe.modeByTime();
  const power = savedPower === null ? true : (savedPower === '1');

  // применяем: сначала режим (без старта, если выключено), потом power
  Vibe.setMode(mode, false);
  // зафиксируем выбранный режим в хранилище, только если пользователь ещё не выбирал
  if(!savedMode){ try{ localStorage.setItem(PREF_KEY, mode); }catch(e){} }

  Vibe.setEnabled(power, false);
})();

/* ============================================================
   КОНЕЦ script.js
   ============================================================ */
