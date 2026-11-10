/* Progressive enhancement only. Text, citations and full-size image links work without JS. */
(() => {
  'use strict';
  const printButton = document.querySelector('[data-print]');
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener('click', () => window.print());
  }
  const viewer = document.querySelector('.art-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const display = viewer.querySelector('.viewer-image');
  const closeButton = viewer.querySelector('.viewer-close');
  let opener = null;
  document.querySelectorAll('a[data-enlarge], .editorial-art a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const source = link.querySelector('img');
      if (!source) return;
      event.preventDefault();
      opener = link;
      display.src = link.href;
      display.alt = source.alt;
      viewer.showModal();
      closeButton.focus();
    });
  });
  closeButton.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    display.removeAttribute('src');
    if (opener) opener.focus();
  });
})();
