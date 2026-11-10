import { courtFile, initialCourtState, courtTransition } from './court-file-model.mjs';
import { bridgeLayers, pendingCases, decidePending, pendingCount, readCourtSession } from './court-desk-model.mjs';

const asset = path => new URL(path, import.meta.url).href;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const courtSeal = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="32" cy="32" r="25"/><path d="M22 28l-3-13 8 6 5-10 5 10 8-6-3 13zM23 31h18"/><text x="32" y="48" text-anchor="middle" fill="currentColor" stroke="none" font-family="Court Manrope,sans-serif" font-size="17" font-weight="600">UW</text></svg>';
const bridgeDrawing = '<svg class="cs-bridge-drawing" viewBox="0 0 420 140" role="img" aria-label="Field sketch locating a fracture in the bridge’s primary support"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M16 55h388M16 64h388M26 55V35h368v20M30 35v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20m30-20v20M40 64v48h24V64m134 0v48h24V64m134 0v48h24V64M64 98q67-73 134 0m24 0q67-73 134 0M8 118q24-8 48 0t48 0t48 0t48 0t48 0t48 0t48 0t48 0t48 0"/><path stroke="#9a3423" stroke-width="2" d="M198 81l12 7-8 7 13 7-10 9"/><circle stroke="#9a3423" cx="208" cy="94" r="25"/><path stroke="#9a3423" d="M231 94h67"/></g><text x="305" y="98" fill="#9a3423" font-size="11" font-family="sans-serif">fracture</text></svg>';
const stampDrawing = `<img class="cs-stamp-art" src="${asset('little-king/seal-tool-v4.webp')}" width="80" height="104" alt="">`;

export function mountCourtDesk(host, { close, expand, story = false, session, onChange } = {}) {
  const restored = readCourtSession(session);
  let state = restored.state;
  let depth = 0;
  let selected = -1;
  let view = 'document';
  let crowded = restored.crowded;
  let decisions = restored.decisions;
  let sealing = false;
  let paperScale = 1, paperX = 0, paperY = 0, readCloser = false;
  const find = selector => host.querySelector(selector);
  host.innerHTML = `<section class="court-desk" aria-label="The king’s desk — an interactive fictional case">
    <img class="cs-backdrop" src="${asset('little-king/desk-v4.webp')}" alt="" fetchpriority="high">
    <div class="cs-shade" aria-hidden="true"></div>
    <header class="cs-header"><a class="cs-brand" href="${new URL('../index.html', import.meta.url)}"><img src="${asset('logo-dark.svg')}" width="48" height="36" alt="UW"><span>usefulwrong <span>/ the king’s desk</span></span></a><div class="cs-header-actions">${expand ? '<button type="button" class="cs-close" data-expand>Full screen <span aria-hidden="true">↗</span></button>' : ''}${close ? '<button type="button" class="cs-close" data-close>Return to the essay <span aria-hidden="true">×</span></button>' : `<a class="cs-close" href="${new URL('../works/little-king.html', import.meta.url)}">Back to the essay <span aria-hidden="true">↗</span></a>`}</div></header>
    <div class="cs-case-caption"><span data-case-ref>17 / D</span><h1 data-case-heading>The East Bridge</h1><p data-voice>Your Majesty, the file is ready for your seal.</p></div>
    <div class="cs-workarea">
      <div class="cs-underlayers" aria-hidden="true"><div><span>17 / A · Field record</span></div><div><span>17 / B · Works office</span></div><div><span>17 / C · Council brief</span></div></div>
      <article class="cs-document" data-paper tabindex="0" aria-labelledby="cs-document-title"></article>
      <button type="button" class="cs-review-slip" data-review-slip hidden><span>Examiner’s reply</span><strong>No contradiction found.</strong><small>Read the attached note ↗</small></button>
      <div class="cs-clutter" data-clutter hidden aria-label="Other files waiting for your seal"></div>
      <div class="cs-dispatches" data-dispatches hidden></div>
    </div>
    <footer class="cs-controls">
      <div class="cs-reading-controls"><div class="cs-route" role="group" aria-label="Papers and letter size" data-route></div><button type="button" class="cs-text-control" data-review>Ask for another check</button><button type="button" class="cs-text-control" data-back-desk hidden>Return to my desk</button></div>
      <div class="cs-signing"><button type="button" class="cs-stamp-tool" data-seal aria-label="Affix the royal seal, or drag it onto the document">${stampDrawing}<span data-seal-label>Affix the seal</span></button><button type="button" class="cs-withhold" data-withhold>Withhold assent</button></div>
      <div class="cs-inbox-controls"><span class="cs-count" data-inbox-count>One file for your attention</span><button type="button" class="cs-delegate" data-delegate hidden>Let the steward choose<br>what needs my attention</button><button type="button" class="cs-text-control" data-reset>Begin again</button></div>
    </footer>
    <p class="cs-fiction">A fictional court.<span class="cs-fiction-detail"> Every paper can be inspected. No real orders are sent.</span></p><span class="cs-sr-only" role="status" data-live></span>
  </section>`;
  const scene = find('.court-desk');
  scene.classList.toggle('is-story-mode', story);
  scene.classList.toggle('has-seen-source', state.discovered);
  scene.classList.toggle('is-delegated', state.delegated);
  if (window.top !== window.self) host.querySelectorAll('a').forEach(link => { link.target = '_top'; });
  const paper = find('[data-paper]');
  const stamp = find('[data-seal]');
  const workarea = find('.cs-workarea');
  const underlayers = find('.cs-underlayers');

  function positionPaper() {
    paper.style.setProperty('--cs-paper-scale', paperScale);
    paper.style.setProperty('--cs-paper-x', `${paperX}px`);
    paper.style.setProperty('--cs-paper-y', `${paperY}px`);
  }
  function movePaper(dx, dy) {
    const maxX = (workarea.clientWidth + paper.offsetWidth * paperScale) / 2 - 64;
    const maxY = (workarea.clientHeight + paper.offsetHeight * paperScale) / 2 - 64;
    paperX = Math.max(-maxX, Math.min(maxX, paperX + dx));
    paperY = Math.max(-maxY, Math.min(maxY, paperY + dy));
    positionPaper();
  }
  function fitPaper() {
    if (!workarea.clientWidth || !paper.offsetHeight) return;
    const height = Math.min(workarea.clientHeight, find('.cs-controls').offsetTop - workarea.offsetTop - 16);
    const width = paper.offsetWidth, naturalHeight = paper.offsetHeight;
    // Include the fanned sheets in the fit, so the whole physical object stays visible.
    const fit = Math.min(1, (workarea.clientWidth - 48) / (width + naturalHeight * .105 + 24), (height - 24) / (naturalHeight + width * .105 + 24));
    paperScale = Math.max(.05, readCloser ? Math.max(1, fit * 1.25) : fit);
    paper.style.top = `${height / 2}px`;
    underlayers.style.cssText = `width:${width}px;height:${naturalHeight}px;top:${height / 2}px;transform:translate(-50%,-50%) scale(${Math.max(.05,fit)})`;
    const clutter = find('[data-clutter]');
    clutter.style.height = `${Math.max(0, height)}px`;
    for (const envelope of clutter.children) {
      const x = parseFloat(envelope.style.getPropertyValue('--x')) / 100;
      const y = parseFloat(envelope.style.getPropertyValue('--y')) / 100;
      envelope.style.left = `${16 + Math.max(0, workarea.clientWidth - envelope.offsetWidth - 32) * x}px`;
      envelope.style.top = `${16 + Math.max(0, height - envelope.offsetHeight - 32) * y}px`;
    }
    positionPaper();
    const size = find('[data-paper-size]');
    size.textContent = readCloser ? 'Fit letter' : 'Read closer';
    size.setAttribute('aria-pressed', String(readCloser));
    size.title = 'Resize the whole letter. Drag it, or use Shift + arrow keys to move it.';
  }

  function currentLayer() {
    if (view === 'review') return { kind: 'review', office: 'Examiner / reviewing agent', reference: '17 / R', title: 'No contradiction found', body: [courtFile.examiner.result], signature: 'The appointed examiner', instruction: courtFile.examiner.task, note: 'Documents received: Works 17/B and Market 7/B. Supplied by the steward.' };
    if (selected >= 0) {
      const item = pendingCases[selected];
      return depth === 0 ? { kind: 'royal', office: item.office, reference: item.reference, title: item.title, body: ['Your Majesty,', item.recommendation, 'The responsible office respectfully requests your assent.'], signature: item.office, note: 'Recommendation prepared for the Crown' } : { kind: 'inspection', office: item.office + ' / underlying record', reference: item.reference + ' / source', title: 'What the record contains', body: [item.source], signature: 'Record attached to the recommendation', note: 'This is the record supplied with this file.' };
    }
    return bridgeLayers[depth];
  }
  function decision() { return selected >= 0 ? decisions[selected] : state.decision; }
  function snapshot() { return { version: 1, state: { ...state }, decisions: { ...decisions }, crowded }; }
  function say(text) {
    find('[data-voice]').textContent = text; find('[data-live]').textContent = text;
    onChange?.(snapshot());
  }
  function renderPaper() {
    const layer = currentLayer();
    const result = decision();
    paper.dataset.kind = layer.kind;
    paper.classList.toggle('is-signed', Boolean(result));
    paper.classList.toggle('is-source', layer.kind === 'inspection');
    paper.style.removeProperty('transform');
    paper.innerHTML = `<div class="cs-paper-content"><div class="cs-paper-meta"><span>${layer.office}</span><span>${layer.reference}</span></div>
      <img class="cs-ornament" src="${asset('royal-flourish.svg')}" width="560" height="96" alt="">
      <h2 id="cs-document-title">${layer.title}</h2>
      ${layer.kind === 'inspection' && selected < 0 ? bridgeDrawing : ''}
      <div class="cs-paper-body">${layer.body.map(text => `<p>${text}</p>`).join('')}</div>
      ${layer.instruction ? `<div class="cs-instruction"><span>Instruction received</span><p>“${layer.instruction}”</p></div>` : ''}
      <div class="cs-paper-signature"><span>${layer.signature}</span>${selected < 0 && state.reviewed && depth === 0 && view !== 'review' ? '<button type="button" class="cs-examined" data-read-review>Examiner checked ↗</button>' : ''}</div>
      <p class="cs-paper-note">${layer.note}</p></div>
      ${result === 'approved' ? `<span class="cs-wax" role="img" aria-label="Royal seal affixed">${courtSeal}</span>` : result === 'withheld' ? '<span class="cs-held">Assent withheld</span>' : ''}
      <button type="button" class="cs-peel" data-peel aria-label="${atSource() ? 'Back to the king. Return to the king’s desk' : 'Look beneath. Pull back this paper to read its source'}"><span>${atSource() ? 'Back to the king' : 'Look beneath'}</span><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M64 0v64H0z" fill="#000" opacity=".12"/><path d="M64 0Q44 40 0 64h64z" fill="#e0cfaa"/><path d="M64 0Q44 40 0 64" fill="none" stroke="#7a6342" stroke-opacity=".45"/></svg></button>`;
    const peel = find('[data-peel]');
    wireDrag(peel, 'paper');
    find('[data-read-review]')?.addEventListener('click', () => showReview());
    renderControls();
    fitPaper();
  }
  function atSource() { return view === 'document' && depth === (selected < 0 ? 3 : 1); }
  function renderControls() {
    scene.classList.toggle('has-opened-file', depth > 0 || view === 'review' || state.discovered);
    const result = decision();
    const labels = selected < 0 ? ['Warrant', 'Steward', 'Clerk', 'Inspection'] : ['Recommendation', 'Source'];
    find('[data-route]').innerHTML = labels.map((label, index) => `<button type="button" data-depth="${index}" ${view === 'document' && depth === index ? 'aria-current="step"' : ''}>${label}</button>`).join('') + '<button type="button" class="cs-size-control" data-paper-size>Read closer</button>';
    find('[data-route]').querySelectorAll('[data-depth]').forEach(button => button.addEventListener('click', () => setDepth(Number(button.dataset.depth))));
    find('[data-paper-size]').addEventListener('click', () => {
      if (scene.classList.contains('is-embedded')) expand?.();
      readCloser = !readCloser; paperX = 0; paperY = 0; fitPaper();
    });
    find('[data-review]').hidden = selected >= 0;
    find('[data-review]').disabled = state.reviewed;
    find('[data-review]').textContent = state.reviewed ? 'A second agent has checked' : 'Ask for another check';
    find('[data-review-slip]').hidden = !state.reviewed || selected >= 0 || view === 'review';
    find('[data-back-desk]').hidden = selected < 0 && !atSource();
    const readingFile = selected >= 0 || depth > 0 || view === 'review';
    scene.classList.toggle('is-reading-file', readingFile);
    find('[data-clutter]').inert = readingFile || state.delegated;
    stamp.disabled = Boolean(result);
    find('[data-seal-label]').textContent = result === 'approved' ? 'Seal affixed' : result === 'withheld' ? 'Assent withheld' : 'Affix the seal';
    stamp.setAttribute('aria-label', `${find('[data-seal-label]').textContent}. ${result ? 'This decision is recorded.' : 'You can also drag the seal onto the document.'}`);
    find('[data-withhold]').disabled = Boolean(result);
    find('[data-withhold]').textContent = result === 'withheld' ? 'Withheld' : 'Withhold assent';
    find('[data-case-ref]').textContent = currentLayer().reference;
    find('[data-case-heading]').textContent = selected < 0 ? 'The East Bridge' : pendingCases[selected].title;
    find('[data-inbox-count]').textContent = crowded ? `${pendingCount(decisions)} files still await your seal` : 'One file for your attention';
    find('[data-delegate]').hidden = !crowded;
    find('[data-delegate]').disabled = state.delegated;
    find('[data-delegate]').innerHTML = state.delegated ? 'The steward is choosing<br>what reaches your desk' : 'Let the steward choose<br>what needs my attention';
  }
  function turnPage(change) {
    find('[data-dispatches]').hidden = true;
    const keepFocus = paper.contains(document.activeElement) || find('[data-route]').contains(document.activeElement);
    const ghost = paper.cloneNode(true);
    if (!reducedMotion()) {
      ghost.classList.add('cs-ghost'); ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
      ghost.removeAttribute('data-paper');
      ghost.querySelectorAll('[data-peel],[data-read-review]').forEach(element => { element.removeAttribute('data-peel'); element.removeAttribute('data-read-review'); });
      ghost.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      ghost.style.width = `${paper.offsetWidth}px`; ghost.style.height = `${paper.offsetHeight}px`;
      find('.cs-workarea').append(ghost);
      ghost.animate([{ transform: getComputedStyle(paper).transform, opacity: 1 }, { transform: `translate(calc(-50% - 46vw), calc(-50% + 12vh)) rotate(-18deg) scale(${paperScale})`, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' }).finished.catch(() => {}).then(() => ghost.remove());
    }
    paper.getAnimations().forEach(animation => animation.cancel());
    readCloser = false; paperX = 0; paperY = 0;
    change(); renderPaper();
    if (keepFocus) find('[data-peel]').focus({ preventScroll: true });
    if (!reducedMotion()) paper.animate([{ transform: `translate(-50%,calc(-50% + 16px)) rotate(2deg) scale(${paperScale})`, opacity: .5 }, { transform: getComputedStyle(paper).transform, opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function setDepth(next) {
    if (next < 0 || next > (selected < 0 ? 3 : 1)) return;
    turnPage(() => { depth = next; view = 'document'; });
    if (selected < 0 && depth === 3) {
      state = courtTransition(state, 'inspect');
      scene.classList.add('has-seen-source');
      say('The original warning. No later inspection or repair is recorded.');
    } else say(currentLayer().office + '. ' + currentLayer().note);
  }
  function lookBeneath() {
    if (atSource()) { returnToDesk(); return; }
    if (view === 'review') { setDepth(2); return; }
    setDepth(depth + 1);
  }
  function showReview() {
    turnPage(() => { selected = -1; view = 'review'; });
    say('A new examiner. The steward selected the documents it received.');
  }
  function makeClutter() {
    if (find('[data-clutter]').children.length) return;
    find('[data-clutter]').hidden = false;
    const positions = [[74,14,-8],[83,37,7],[65,67,-12],[10,68,7],[3,39,-6],[81,6,12],[72,53,5],[17,12,-12],[5,80,-3],[86,72,9],[60,9,-6],[29,78,10]];
    find('[data-clutter]').innerHTML = pendingCases.map((item,index) => { const [x,y,r] = positions[index % positions.length]; const offset = Math.floor(index / positions.length); return `<button type="button" class="cs-envelope${Object.hasOwn(decisions,index) ? ' is-resolved' : ''}" data-case="${index}" ${Object.hasOwn(decisions,index) ? 'disabled' : ''} style="--x:${x + offset * 1.2}%;--y:${y + offset * 1.5}%;--r:${r + offset * 2}deg;--delay:${Math.min(index * 45, 900)}ms"><span class="cs-envelope-fold" aria-hidden="true"></span><small>${item.reference} / ${item.office}</small><strong>${item.title}</strong><span class="cs-envelope-wax" aria-hidden="true"></span><span class="cs-envelope-action">Open file ↗</span></button>`; }).join('');
    find('[data-clutter]').querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.case);
      if (Object.hasOwn(decisions,index)) return;
      scene.classList.add('is-reading-file');
      find('[data-dispatches]').hidden = true;
      turnPage(() => { selected = index; depth = 0; view = 'document'; });
      say('Another recommendation. Its underlying record is one paper beneath.');
    }));
    fitPaper();
  }
  function returnToDesk() {
    if (scene.classList.contains('is-embedded')) expand?.();
    turnPage(() => { selected = -1; depth = 0; view = 'document'; });
    scene.classList.remove('is-reading-file');
    if (state.discovered && !crowded) {
      crowded = true; makeClutter(); find('[data-clutter]').hidden = false; scene.classList.add('is-crowded');
      say('Your Majesty, while you were reading, twenty-four more files arrived.');
    } else if (crowded) say(`${pendingCount(decisions)} more decisions. All prepared for your seal.`);
    renderControls();
    paper.tabIndex = -1; paper.focus({ preventScroll: true });
  }
  function resolve(verdict) {
    if (sealing || decision()) return;
    const approve = verdict === 'approved';
    if (selected < 0) state = courtTransition(state, approve ? 'approve' : 'withhold');
    else decisions = decidePending(decisions, selected, verdict);
    renderPaper();
    if (approve && !reducedMotion()) {
      const stampBounds = stamp.getBoundingClientRect();
      const waxBounds = paper.querySelector('.cs-wax').getBoundingClientRect();
      const dx = waxBounds.left + waxBounds.width / 2 - (stampBounds.left + stampBounds.width / 2);
      const dy = waxBounds.top + waxBounds.height / 2 - (stampBounds.top + stampBounds.height / 2);
      sealing = true; scene.classList.add('is-sealing');
      stamp.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${dx}px,${dy - 16}px) rotate(-8deg)`, offset: .45 }, { transform: `translate(${dx}px,${dy}px) rotate(-8deg) scale(.91)`, offset: .6 }, { transform: 'translate(0,0) rotate(0)' }], { duration: 1000, easing: 'cubic-bezier(.22,1,.36,1)' }).finished.catch(() => {}).then(() => { sealing = false; scene.classList.remove('is-sealing'); });
      find('.cs-wax')?.classList.add('is-fresh');
    }
    if (selected >= 0) {
      const envelope = find(`[data-case="${selected}"]`);
      envelope?.classList.add('is-resolved');
      if (envelope) envelope.disabled = true;
    }
    const result = find('[data-dispatches]');
    result.innerHTML = approve ? `<span class="cs-dispatch-heading">Orders released</span>${(selected < 0 ? courtFile.dispatches : [`${pendingCases[selected].office}: proceed under the royal seal.`]).map(text => `<p>${text}</p>`).join('')}` : '<span class="cs-dispatch-heading">Assent withheld</span><p>The file is held for a fresh assessment of its underlying record.</p>';
    const dismiss = document.createElement('button');
    dismiss.type = 'button'; dismiss.className = 'cs-text-control'; dismiss.dataset.dismissDispatch = '';
    dismiss.textContent = 'Set aside ×'; dismiss.addEventListener('click', () => { result.hidden = true; });
    result.append(dismiss);
    result.hidden = false;
    say(approve ? 'The seal has released the orders. The recipients will not receive the whole file.' : 'The order is held. You can still inspect its source.');
    paper.tabIndex = -1; paper.focus({ preventScroll: true });
  }
  function wireDrag(handle, type) {
    let origin = null, moved = false, suppressClick = false, frame = 0, dx = 0, dy = 0;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || handle.disabled) return;
      if (type === 'move' && scene.classList.contains('is-embedded')) return;
      if (type === 'move' && event.target.closest('button,a')) return;
      origin = { x: event.clientX, y: event.clientY }; moved = false; dx = 0; dy = 0;
      handle.setPointerCapture(event.pointerId); event.preventDefault();
      if (type === 'stamp') scene.classList.add('is-stamping');
    });
    handle.addEventListener('pointermove', event => {
      if (!origin) return;
      dx = event.clientX - origin.x; dy = event.clientY - origin.y;
      moved ||= Math.hypot(dx,dy) > 6;
      if (!moved || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (type === 'paper' || type === 'move') paper.style.transform = `translate(calc(-50% + ${paperX + dx}px),calc(-50% + ${paperY + dy}px)) rotateX(${type === 'paper' ? Math.min(18, Math.abs(dy) / 12) : 0}deg) rotate(${-0.6 + (type === 'paper' ? dx / 28 : 0)}deg) scale(${paperScale})`;
        else stamp.style.transform = `translate(${dx}px,${dy}px) rotate(-8deg)`;
      });
    });
    function finish(event, cancelled = false) {
      if (!origin) return;
      origin = null; cancelAnimationFrame(frame); frame = 0; suppressClick = moved;
      scene.classList.remove('is-stamping');
      if (type === 'paper') {
        if (!cancelled && moved && Math.hypot(dx,dy) > 70) lookBeneath();
        else paper.style.removeProperty('transform');
      } else if (type === 'move') {
        if (!cancelled && moved) movePaper(dx, dy);
        paper.style.removeProperty('transform'); positionPaper();
      } else {
        const bounds = paper.getBoundingClientRect();
        stamp.style.removeProperty('transform');
        if (!cancelled && moved && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) resolve('approved');
      }
    }
    handle.addEventListener('pointerup', event => finish(event));
    handle.addEventListener('pointercancel', event => finish(event,true));
    handle.addEventListener('click', event => {
      if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
      if (type === 'paper') lookBeneath(); else if (type === 'stamp') resolve('approved');
    });
  }
  wireDrag(stamp,'stamp');
  wireDrag(paper,'move');
  paper.addEventListener('wheel', event => { if (!scene.classList.contains('is-embedded')) event.preventDefault(); }, { passive: false });
  find('[data-withhold]').addEventListener('click', () => resolve('withheld'));
  find('[data-review]').addEventListener('click', () => {
    state = courtTransition(state,'review'); renderPaper();
    say('The new examiner found no contradiction in the supplied documents. Its reply is attached.');
    find('[data-review-slip]').focus({ preventScroll: true });
  });
  find('[data-review-slip]').addEventListener('click', showReview);
  find('[data-back-desk]').addEventListener('click', returnToDesk);
  find('[data-delegate]').addEventListener('click', () => {
    state = courtTransition(state,'delegate'); scene.classList.add('is-delegated');
    turnPage(() => { selected = -1; depth = 0; view = 'document'; });
    scene.classList.remove('is-reading-file');
    say('The steward will decide which files need your attention. One summary will reach your desk.'); renderControls();
    paper.tabIndex = -1; paper.focus({ preventScroll: true });
  });
  find('[data-reset]').addEventListener('click', () => {
    state = initialCourtState(); decisions = {}; selected = -1; depth = 0; view = 'document'; crowded = false;
    readCloser = false; paperX = 0; paperY = 0;
    scene.classList.remove('has-seen-source','is-crowded','is-reading-file','is-delegated');
    find('[data-clutter]').replaceChildren(); find('[data-clutter]').hidden = true; find('[data-dispatches]').hidden = true;
    renderPaper(); say('Your Majesty, the file is ready for your seal.');
  });
  find('[data-close]')?.addEventListener('click', close);
  find('[data-expand]')?.addEventListener('click', expand);
  scene.addEventListener('keydown', event => {
    if ((event.target.closest('button,a') && !event.target.closest('[data-peel]')) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.shiftKey && event.key.startsWith('Arrow')) {
      event.preventDefault();
      movePaper(event.key === 'ArrowRight' ? 40 : event.key === 'ArrowLeft' ? -40 : 0, event.key === 'ArrowDown' ? 40 : event.key === 'ArrowUp' ? -40 : 0);
      return;
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); lookBeneath(); }
    if (event.key === 'ArrowLeft' && depth > 0) { event.preventDefault(); setDepth(depth - 1); }
  });
  renderPaper();
  if (crowded) {
    makeClutter(); find('[data-clutter]').hidden = false; scene.classList.add('is-crowded');
  }
  const layout = new ResizeObserver(fitPaper);
  [paper, workarea, find('.cs-controls')].forEach(element => layout.observe(element));
  document.fonts.ready.then(fitPaper);
  return {
    snapshot,
    fit: fitPaper,
    setEmbedded(embedded) {
      scene.classList.toggle('is-embedded', embedded);
      if (close) find('[data-close]').innerHTML = embedded ? 'Continue the essay <span aria-hidden="true">↓</span>' : 'Return to the essay <span aria-hidden="true">×</span>';
      if (expand) find('[data-expand]').hidden = !embedded;
      requestAnimationFrame(fitPaper);
    },
    show(stage) {
      if (stage === 'queue' && state.discovered) { returnToDesk(); return; }
      selected = -1; scene.classList.remove('is-reading-file');
      if (stage === 'source' || stage === 'queue') setDepth(3);
      else if (stage === 'review') {
        state = courtTransition(state, 'review'); showReview();
      } else setDepth(0);
    },
  };
}

const standalone = document.querySelector('[data-court-desk]');
if (standalone) mountCourtDesk(standalone);
