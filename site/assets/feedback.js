(() => {
  const $ = id => document.getElementById(id);
  const form = $('uw-feedback');
  if (!form) return;
  form.querySelector('.feedback-actions').hidden=false;
  form.querySelector('.feedback-prepared').hidden=false;
  const params = new URLSearchParams(window.location.search);
  const selectedWork = params.get('work');
  if (selectedWork && Array.from($('work').options).some(x => x.value === selectedWork)) $('work').value=selectedWork;
  if (params.get('section')) $('section').value=params.get('section').slice(0,220);
  if (params.get('passage')) $('passage').value=params.get('passage').slice(0,6000);
  const optional=form.querySelector('.optional-context');
  if (optional && (params.get('section') || params.get('passage'))) optional.open=true;
  const back = $('back-to-passage');
  if (back && ['motion','little-king'].includes(selectedWork)) {
    back.href='../works/'+selectedWork+'.html#'+encodeURIComponent(params.get('anchor') || 'opening');
    back.hidden=false;
  }
  const result = $('prepared'), status=$('feedback-status');
  function prepare() {
    const note=$('objection').value.trim();
    if (!note) { $('objection').setAttribute('aria-invalid','true'); status.textContent='Write the objection or evidence first. Nothing has been sent.'; $('objection').focus(); return null; }
    $('objection').removeAttribute('aria-invalid');
    const work=$('work').selectedOptions[0].textContent;
    const sourcePath={motion:'works/motion.html','little-king':'works/little-king.html',apprenticeship:'questions/#apprenticeship',exomemory:'questions/#memory',general:''}[$('work').value] || '';
    const lines=['# UsefulWrong — reader feedback','', 'Work: '+work, 'Type: '+$('kind').selectedOptions[0].textContent];
    if ($('section').value.trim()) lines.push('Section: '+$('section').value.trim());
    if ($('passage').value.trim()) lines.push('','Passage:','> '+$('passage').value.trim().replace(/\n/g,'\n> '));
    lines.push('','Response:',note,'','Page: https://usefulwrong.com/' + sourcePath, '', 'Prepared locally; not submitted automatically.');
    const msg=lines.join('\n');result.value=msg;return msg;
  }
  $('copy-feedback').addEventListener('click', async () => {
    const msg=prepare(); if (!msg) return;
    try { await navigator.clipboard.writeText(msg); status.textContent='Copied. Nothing has been submitted. Paste into a suitable Reddit discussion if you want to send it publicly.'; }
    catch { result.focus(); result.select(); status.textContent='Automatic copy was blocked. Select the prepared message below and copy it. Nothing has been sent.'; }
  });
  $('download-feedback').addEventListener('click', () => {
    const msg=prepare(); if (!msg) return;
    const blob=new Blob([msg],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;a.download='uw-feedback-'+$('work').value+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    status.textContent='Downloaded a Markdown draft. Nothing has been submitted.';
  });
})();