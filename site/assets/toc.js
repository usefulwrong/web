/* Mark the section at the reading line without changing focus or URL history. */
(() => {
  'use strict';
  const entries = [...document.querySelectorAll('.toc a[href^="#"]')]
    .map((link) => ({ link, target: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
    .filter((entry) => entry.target);
  if (!entries.length) return;
  let current = null;
  let pending = false;

  function update() {
    pending = false;
    const line = Math.min(120, window.innerHeight * 0.2);
    let active = entries[0];
    for (const entry of entries) {
      if (entry.target.getBoundingClientRect().top <= line) active = entry;
    }
    // A note near the end can share a viewport with the edition controls.
    let fragment = null;
    try {
      fragment = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch { /* A malformed external fragment must not disable the contents. */ }
    const detail = fragment && !entries.some((entry) => entry.target === fragment);
    const bounds = detail && fragment.getBoundingClientRect();
    const visibleDetail = bounds && bounds.top < window.innerHeight && bounds.bottom > 0;
    // The last section may be too short to reach the reading line.
    if (!visibleDetail && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = entries[entries.length - 1];
    }
    if (active === current) return;
    if (current) current.link.removeAttribute('aria-current');
    active.link.setAttribute('aria-current', 'location');
    current = active;
    const nav = active.link.closest('.toc');
    if (nav.scrollHeight > nav.clientHeight) {
      const bounds = nav.getBoundingClientRect();
      const item = active.link.getBoundingClientRect();
      if (item.top < bounds.top) nav.scrollTop += item.top - bounds.top;
      else if (item.bottom > bounds.bottom) nav.scrollTop += item.bottom - bounds.bottom;
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  update();
})();
