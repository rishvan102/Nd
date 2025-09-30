// assets/card-details.js
(() => {
  const details = {
    write: ["Type notes", "Auto paginate A4"],
    txt2pdf: ["Upload .txt/.md", "Quick conversion"],
    compress: ["Shrink size", "Good readability"],
    merge: ["Combine multiple PDFs", "Keep page order"],
    split: ["Extract ranges", "Output multiple files"],
    rotate: ["Fix orientation", "90°/180°/270°"]
  };

  document.querySelectorAll('.card').forEach(card => {
    const id = card.href.split('/').pop().replace('.html','');
    if (details[id]) {
      const ul = document.createElement('ul');
      ul.className = 'card-features';
      details[id].forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
  });
})();
