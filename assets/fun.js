// assets/fun.js — playful micro-animations (no libs)

(() => {
  const cards = Array.from(document.querySelectorAll('.card'));

  // 1) Jelly tap feedback
  cards.forEach(c => {
    c.addEventListener('mousedown', () => {
      c.classList.add('jelly');
      setTimeout(() => c.classList.remove('jelly'), 420);
    });
  });

  // 2) Confetti burst when opening a tool (subtle + fast)
  function burst(el) {
    const N = 16;
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.pointerEvents = 'none';
    box.style.inset = '0';
    box.style.zIndex = 9999;
    document.body.appendChild(box);

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < N; i++) {
      const p = document.createElement('span');
      p.textContent = ['✦','✸','✺','✹','✤','✷'][i % 6];
      p.style.position = 'absolute';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.fontSize = (10 + Math.random()*8) + 'px';
      p.style.opacity = '0.95';
      p.style.transform = 'translate(-50%,-50%)';
      p.style.transition = 'transform 700ms ease, opacity 700ms ease';
      box.appendChild(p);

      // random vector
      const ang = Math.random()*Math.PI*2;
      const dist = 80 + Math.random()*80;
      const dx = Math.cos(ang)*dist;
      const dy = Math.sin(ang)*dist;

      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.random()*360}deg)`;
        p.style.opacity = '0';
      });
    }
    setTimeout(() => box.remove(), 720);
  }

  cards.forEach(c => {
    c.addEventListener('click', () => burst(c), { once:false });
  });
})();
