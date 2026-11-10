import {mountInkPainting} from './ink-coat.js';

const illustration=document.querySelector('[data-inline-coat]');
if(illustration){
  const detail=document.querySelector('#coat-detail-dialog');
  if(detail){
    const art=illustration.querySelector('.ink-coat-art');
    const slot=illustration.querySelector('.coat-slot');
    const closer=illustration.querySelector('.coat-detail');
    const view=detail.querySelector('.coat-view-toggle');
    closer.hidden=false;
    closer.addEventListener('click',()=>{
      detail.dataset.view='detail';view.textContent='See the whole drawing';
      detail.querySelector('.coat-detail-mount').append(art);
      detail.showModal();
    });
    view.addEventListener('click',()=>{
      const whole=detail.dataset.view==='detail';
      detail.dataset.view=whole?'whole':'detail';
      view.textContent=whole?'Look at the coat':'See the whole drawing';
    });
    detail.querySelector('.coat-detail-close').addEventListener('click',()=>detail.close());
    detail.addEventListener('close',()=>{slot.append(art);closer.focus({preventScroll:true});});
    window.addEventListener('beforeprint',()=>{if(detail.open){slot.append(art);detail.close();}});
  }
  // A quiet drawing until the reader chooses to touch it.
  const load=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){
      if(illustration.hasAttribute('data-cloth-cover')){
        import('./coat-painting.js').then(({mountCoatCover})=>mountCoatCover(illustration)).catch(()=>{
          illustration.dataset.ready='fallback';
          illustration.querySelector('.ink-coat-art').dataset.ready='fallback';
        });
      }else mountInkPainting(illustration);
      load.disconnect();
    }
  },{rootMargin:'200px'});
  load.observe(illustration);
}

export function renderMotionExcerpt(panel){
  let disposed=false,unmount;
  const controller=new AbortController();
  panel.innerHTML='<div class="motion-reading-sample" role="status">Loading the passage…</div>';
  fetch('../works/motion.html',{signal:controller.signal}).then(response=>{
    if(!response.ok)throw new Error('Passage unavailable');
    return response.text();
  }).then(html=>{
    if(disposed)return;
    const documentCopy=new DOMParser().parseFromString(html,'text/html');
    const paragraph=documentCopy.querySelector('#motion-coat-context');
    const figure=paragraph?.nextElementSibling;
    if(!figure?.matches('[data-inline-coat]'))throw new Error('Illustrated passage unavailable');
    const sample=document.createElement('article');sample.className='motion-reading-sample';sample.lang='en';sample.setAttribute('aria-label','The illustration in its original passage');
    const continuation=[...documentCopy.querySelectorAll('.motion-prose>p')].slice(0,2);
    for(const block of [paragraph.previousElementSibling,paragraph,figure,...continuation])sample.append(document.importNode(block,true));
    const read=document.createElement('a');read.href='../works/motion.html#motion-coat-context';read.textContent='Read the complete essay ↗';sample.append(read);
    panel.replaceChildren(sample);unmount=mountInkPainting(sample.querySelector('[data-inline-coat]'));
  }).catch(()=>{
    if(disposed)return;
    panel.innerHTML='<div class="motion-reading-sample"><a href="../works/motion.html#motion-coat-context">Read the illustrated passage in the essay ↗</a></div>';
  });
  return()=>{disposed=true;controller.abort();unmount?.();};
}
