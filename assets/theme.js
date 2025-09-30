// Theme toggle (light default, user can switch)
const btn = document.getElementById('themeToggle');
const root = document.documentElement;

// Load saved pref
if (localStorage.getItem('theme')) {
  root.setAttribute('data-theme', localStorage.getItem('theme'));
  btn.textContent = root.dataset.theme === 'dark' ? '🌞' : '🌙';
}

btn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  btn.textContent = next === 'dark' ? '🌞' : '🌙';
});
