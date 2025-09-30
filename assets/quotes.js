// assets/quotes.js — rotates short, upbeat quotes
(() => {
  const QUOTES = [
    "Small steps make big things.",
    "Every page is progress.",
    "Done > Perfect.",
    "Momentum loves action.",
    "Tiny wins add up fast.",
    "Keep going — you’ve got this!",
    "Ship it. Learn. Improve.",
    "Focus on the next page.",
    "Consistency beats intensity.",
    "Create the thing you wish existed.",
    "Today’s 1% is tomorrow’s 100%.",
    "Dream big. Start small. Move now.",
    "Less talk, more pdf. 😉",
    "You’re closer than you think.",
    "Progress, not perfection."
  ];

  const el = document.getElementById('quote');
  const btn = document.getElementById('quoteNext');
  if (!el) return;

  let i = Math.floor(Math.random() * QUOTES.length);
  const set = (n) => { el.innerHTML = `“${QUOTES[n]}” <em>· NiceDay</em>`; };
  set(i);

  const next = () => { i = (i + 1) % QUOTES.length; set(i); };
  btn?.addEventListener('click', next);

  // Auto rotate every 12s, pause on hover
  let timer = setInterval(next, 12000);
  el.addEventListener('mouseenter', () => clearInterval(timer));
  el.addEventListener('mouseleave', () => (timer = setInterval(next, 12000)));
})();
