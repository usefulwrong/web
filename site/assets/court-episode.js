import { mountCourtDesk, courtSeal } from './court-file.js';
import { pendingCases, pendingCount, readCourtSession } from './court-desk-model.mjs';

const episode = document.querySelector('[data-court-episode]');
if (episode) {
  const storageKey = 'uw-king-episode-v1';
  let record = readCourtSession(null);
  try { record = readCourtSession(JSON.parse(sessionStorage.getItem(storageKey))); } catch {}
  const stage = episode.querySelector('[data-episode-stage]');
  stage.classList.add('has-script');
  const host = episode.querySelector('[data-episode-host]');
  let desk = null, dialog = null, origin = null, previousOverflow = '';
  const $ = selector => document.querySelector(selector);

  function update(next) {
    record = next;
    try { sessionStorage.setItem(storageKey, JSON.stringify(record)); } catch {}
    const verdict = record.state.decision;
    $('[data-episode-result]').textContent = verdict === 'approved' ? 'You affixed the seal.' : verdict === 'withheld' ? 'You withheld assent.' : 'One missing condition.';
    $('[data-episode-consequence]').textContent = verdict === 'approved'
      ? 'Your order opened the crossing and stood down the temporary ferry. The field warning was not included.'
      : verdict === 'withheld' ? 'Your order is on hold. The warning was absent from the recommendation either way.'
      : 'The recommendation and the field record belong to the same decision.';
    const seal = $('[data-episode-seal]');
    seal.hidden = !verdict;
    seal.classList.toggle('is-held', verdict === 'withheld');
    seal.innerHTML = verdict === 'approved' ? courtSeal : verdict === 'withheld' ? 'Assent withheld' : '';
    if (verdict) { seal.setAttribute('role', 'img'); seal.setAttribute('aria-label', verdict === 'approved' ? 'Your royal seal' : 'You withheld assent'); }
    else { seal.removeAttribute('role'); seal.removeAttribute('aria-label'); }
    $('[data-episode-review-status]').textContent = record.state.reviewed
      ? 'The examiner found no contradiction in the supplied documents. Open its reply to see what it received.'
      : 'A new examiner. The documents are still chosen by the steward.';
    const count = pendingCount(record.decisions);
    $('[data-episode-inbox-heading]').textContent = record.state.delegated ? 'One summary again.' : count ? `${count} more decisions.` : 'Your desk is clear.';
    $('[data-episode-inbox-note]').textContent = record.state.delegated
      ? `The steward is choosing which of the ${count} remaining files reach you.`
      : count ? 'Each has a source. Each is ready for your seal.' : 'Every file in this fictional batch has a recorded decision.';
  }
  function continueReading() {
    if (dialog?.open) { dialog.close(); return; }
    const next = $('#b021');
    next.tabIndex = -1; next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function ensureDesk() {
    if (desk) return desk;
    host.hidden = false;
    desk = mountCourtDesk(host, { story: true, session: record, onChange: update, close: continueReading, expand: () => openDesk(null, host.querySelector('[data-expand]')) });
    stage.classList.add('is-enhanced');
    desk.setEmbedded(true);
    return desk;
  }
  function openDesk(view, trigger) {
    const engine = ensureDesk();
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'court-theatre'; dialog.setAttribute('aria-label', 'Your file from the royal court');
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        document.documentElement.style.overflow = previousOverflow;
        stage.append(host); stage.classList.remove('is-open-elsewhere');
        engine.setEmbedded(true); engine.show('warrant');
        const focus = origin?.isConnected ? origin : episode.querySelector('[data-episode-continue]');
        focus.focus({ preventScroll: true });
      });
    }
    if (dialog.open) return;
    origin = trigger;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    stage.classList.add('is-open-elsewhere'); dialog.append(host);
    engine.setEmbedded(false); dialog.showModal();
    if (view) engine.show(view);
    engine.fit();
    host.querySelector('[data-paper]').focus({ preventScroll: true });
  }

  $('[data-episode-critic]').hidden = false;
  $('[data-episode-inbox]').hidden = false;
  document.querySelectorAll('[data-episode-open]').forEach(button => {
    button.hidden = false;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => openDesk(button.dataset.episodeOpen, button));
  });
  const arrivals = $('[data-episode-arrivals]');
  arrivals.classList.add('is-enhanced');
  const papers = document.createElement('div');
  papers.className = 'cf-arrival-papers'; papers.setAttribute('aria-hidden', 'true');
  for (const item of pendingCases.slice(0, 3)) {
    const paper = document.createElement('span'); paper.textContent = item.title; papers.append(paper);
  }
  arrivals.append(papers);
  update(record);
  if ('IntersectionObserver' in window) {
    const load = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { ensureDesk(); load.disconnect(); }
    }, { rootMargin: '400px' });
    load.observe(episode);
    const reveal = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { arrivals.classList.add('is-arrived'); reveal.disconnect(); }
    }, { threshold: .15 });
    reveal.observe(arrivals);
  } else { ensureDesk(); arrivals.classList.add('is-arrived'); }

  if (new URLSearchParams(location.search).get('study') === 'bridge') {
    episode.scrollIntoView({ block: 'start', behavior: 'instant' });
    openDesk(null, episode.querySelector('[data-episode-continue]'));
  }
}
