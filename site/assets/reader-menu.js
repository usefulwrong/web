/* Shared reading menu. The article and native CONTENTS remain usable without JS. */
(() => {
  'use strict';
  const article = document.querySelector('.essay');
  const contents = document.querySelector('.reader-contents');
  const toolbar = document.querySelector('.reader-toolbar');
  const drawer = document.querySelector('.reader-drawer');
  if (!article || !contents || !toolbar || !drawer) return;
  const toc = contents.querySelector('.toc');
  const trigger = toolbar.querySelector('.reader-menu-trigger');
  const mobile = matchMedia('(max-width:750px)');
  const headings = [article, ...article.querySelectorAll('h2[id],h3[id]')];
  let selected = null;
  let panelContext = null;
  let responseContext = null;
  let progressed = false;
  let previousOverflow = '';

  function currentContext() {
    let section = article;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= Math.min(120, innerHeight * 0.2)) section = heading;
    }
    return selected || { section, quote: '' };
  }
  document.addEventListener('selectionchange', () => {
    const selection = getSelection();
    const quote = selection?.toString().trim();
    if (!quote || !article.contains(selection.anchorNode) || !article.contains(selection.focusNode)) {
      selected = null;
      return;
    }
    let section = article;
    for (const heading of headings.slice(1)) {
      if (heading.contains(selection.anchorNode) || (heading.compareDocumentPosition(selection.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING)) section = heading;
    }
    selected = { section, quote: quote.slice(0, 6000) };
  });
  function prepareResponse(link, context) {
    const target = new URL(link.href);
    const work = document.body.dataset.work;
    const id = context.section.id;
    const title = context.section === article ? 'Opening' : context.section.textContent.trim();
    target.searchParams.set('section', title + ' — https://usefulwrong.com/works/' + work + '.html#' + id);
    target.searchParams.set('anchor', id);
    if (context.quote) target.searchParams.set('passage', context.quote);
    else target.searchParams.delete('passage');
    link.href = target;
  }
  function captureBeforeFocus(event) {
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    const response = event.target.closest('[data-respond-link]');
    if (response) responseContext = drawer.open && panelContext ? panelContext : currentContext();
    if (event.target.closest('.reader-menu-trigger') || event.target.closest('.reader-contents>summary')) panelContext = currentContext();
  }
  document.addEventListener('pointerdown', captureBeforeFocus);
  document.addEventListener('keydown', captureBeforeFocus);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-respond-link]');
    if (!link) return;
    prepareResponse(link, drawer.open && panelContext ? panelContext : responseContext || currentContext());
    responseContext = null;
  });

  function updateLayout() {
    toolbar.hidden = !mobile.matches || !progressed;
    if (!mobile.matches && drawer.open) drawer.close();
  }
  contents.open = !mobile.matches;
  mobile.addEventListener('change', () => {
    contents.open = !mobile.matches;
    updateLayout();
  });
  const firstSection = article.querySelector('h2');
  if (firstSection && typeof drawer.showModal === 'function') {
    let pending = false;
    function scheduleProgress() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        progressed = firstSection.getBoundingClientRect().top < 60;
        updateLayout();
      });
    }
    // Anchor jumps can skip an observer's entire intersection region.
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress);
    scheduleProgress();
  }
  trigger.addEventListener('click', () => {
    panelContext ||= currentContext();
    const copy = toc.cloneNode(true);
    copy.className = 'drawer-toc';
    copy.setAttribute('aria-label', 'Reading menu contents');
    drawer.querySelector('.reader-drawer-contents').replaceChildren(copy);
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    drawer.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    drawer.querySelector('.reader-close').focus();
  });
  drawer.querySelector('.reader-close').addEventListener('click', () => drawer.close());
  drawer.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    trigger.setAttribute('aria-expanded', 'false');
    panelContext = null;
    (toolbar.hidden ? contents.querySelector('summary') : trigger).focus({ preventScroll: true });
  });
  drawer.addEventListener('click', (event) => {
    const bounds = drawer.getBoundingClientRect();
    if (event.target === drawer && (event.clientX < bounds.left || event.clientX > bounds.right)) drawer.close();
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('.reader-contents a[href^="#"], .reader-drawer a[href^="#"]');
    if (!link || !mobile.matches) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    selected = null;
    if (drawer.open) drawer.close();
    contents.open = false;
    history.pushState(null, '', link.hash);
    requestAnimationFrame(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  });
})();
