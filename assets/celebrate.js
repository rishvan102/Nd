// assets/celebrate.js — popup card with quote only (no filename), single cracker behind
(function(){
  if (window.__ndCelebrateMounted) return;
  window.__ndCelebrateMounted = true;

  const QUOTES = [
    "Keep going — you’ve got this! 💪",
    "Every page is progress. 📄",
    "Small steps make big things. 🌱",
    "Done is better than perfect. 🚀",
    "Momentum loves action. ⚡",
    "Dream big, start small. ✨",
    "Consistency beats intensity. 🔑"
  ];
  const pick = () => QUOTES[(Math.random()*QUOTES.length)|0];

  // Cooldown to avoid multiple popups if browser triggers several download events quickly
  let lastShownAt = 0;
  const COOLDOWN_MS = 1200;

  const css = `
    #ndCelebrate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.35);backdrop-filter:blur(2px);z-index:99999;
      opacity:0;pointer-events:none;transition:opacity .25s; font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial}
    #ndCelebrate.show{opacity:1;pointer-events:auto}
    #ndCardWrap{position:relative;display:inline-block}
    #ndFx{position:absolute;inset:0;z-index:0;pointer-events:none}
    #ndCard{position:relative;z-index:1;background:#fff;color:#111;border-radius:16px;
      box-shadow:0 12px 40px rgba(0,0,0,.3); padding:24px 28px; max-width:420px; text-align:center;
      font-size:1.2rem;font-weight:600;line-height:1.4; animation:ndPop .28s ease}
    @keyframes ndPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function ensureUI(){
    let w = document.getElementById('ndCelebrate');
    if (w) return w;
    w = document.createElement('div');
    w.id = 'ndCelebrate';
    w.innerHTML = `
      <div id="ndCardWrap">
        <canvas id="ndFx" width="500" height="360"></canvas>
        <div id="ndCard">“Loading motivation…”</div>
      </div>`;
    document.body.appendChild(w);
    w.addEventListener('click', ()=>w.classList.remove('show'));
    return w;
  }

  // Draw one angled cracker behind card + simple confetti burst
  function animate(canvas){
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const parts = [];
    for (let i=0;i<60;i++){
      const ang = (-Math.PI/2)+(Math.random()*Math.PI/2 - Math.PI/4);
      const spd = 3+Math.random()*3;
      parts.push({
        x:W/2, y:H-50, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd-4,
        rot:Math.random()*360, dr:(Math.random()-0.5)*6,
        life:70+Math.random()*40, color:`hsl(${Math.random()*360},90%,60%)`, size:3+Math.random()*6
      });
    }
    function frame(){
      ctx.clearRect(0,0,W,H);

      // cracker body (striped cylinder)
      ctx.save(); ctx.translate(W/2,H-40); ctx.rotate(-Math.PI/8);
      ctx.fillStyle="#ffd28a"; roundRect(ctx,-65,-22,130,44,16); ctx.fill();
      ctx.strokeStyle="#ff6b6b"; ctx.lineWidth=6;
      for (let i=-54;i<60;i+=22){ ctx.beginPath(); ctx.moveTo(i,-18); ctx.lineTo(i+20,18); ctx.stroke(); }
      ctx.restore();

      let alive=false;
      for (const p of parts){
        if (p.life<=0) continue;
        alive=true;
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.rot+=p.dr; p.life--;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore();
      }
      if (alive) requestAnimationFrame(frame);
    }
    frame();

    function roundRect(ctx,x,y,w,h,r){
      const rr=Math.min(r,w/2,h/2);
      ctx.beginPath();
      ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr);
      ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr);
      ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
    }
  }

  function show(msg){
    const now = Date.now();
    if (now - lastShownAt < COOLDOWN_MS) return;
    lastShownAt = now;

    const w = ensureUI();
    w.classList.add('show');
    w.querySelector('#ndCard').textContent = msg || `“${pick()}”`;
    animate(w.querySelector('#ndFx'));
    setTimeout(()=>w.classList.remove('show'), 1800);
  }

  // Public API
  window.ndCelebrate = show;

  // --- Auto-hooks (NO filename passed) ---
  // <a download>
  try {
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(){
      const isDl = this.hasAttribute('download');
      const ret = origClick.apply(this, arguments);
      if (isDl) setTimeout(()=>show(), 60);   // <-- no filename
      return ret;
    };
  } catch {}

  // jsPDF().save()
  function tryPatchJsPDF(){
    try {
      const API = window.jspdf?.jsPDF?.API;
      if (!API || !API.save || API.__ndPatched) return !!API?.__ndPatched;
      const _save = API.save;
      API.save = function(){
        const r = _save.apply(this, arguments);
        setTimeout(()=>show(), 60);          // <-- no filename
        return r;
      };
      API.__ndPatched = true;
      return true;
    } catch { return false; }
  }
  if (!tryPatchJsPDF()){
    window.addEventListener('load', tryPatchJsPDF, { once:true });
    document.addEventListener('readystatechange', tryPatchJsPDF, { once:true });
  }
})();
