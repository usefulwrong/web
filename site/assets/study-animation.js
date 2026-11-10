// A scene owns its animation and stops it when another studio tab replaces it.
export function createStudyAnimation(scene, tick) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let previous = 0;
  let visible = true;
  let disposed = false;
  function run(now) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const again = tick(Math.min(.032,(now-previous)/1000 || .016),now/1000,preference.matches);
    previous = now;
    if (again && !preference.matches) frame = requestAnimationFrame(run);
  }
  function wake() {
    if (disposed) return;
    if (preference.matches) {
      cancelAnimationFrame(frame);frame=0;
      tick(0,performance.now()/1000,true);
      return;
    }
    if (!frame && !disposed && visible && !document.hidden) {
      previous = performance.now();
      frame = requestAnimationFrame(run);
    }
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake();
    else { cancelAnimationFrame(frame); frame=0; }
  });
  observer.observe(scene);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame);frame=0; } else wake(); };
  document.addEventListener('visibilitychange',visibility);
  preference.addEventListener('change',wake);
  wake();
  return {wake, reduced:()=>preference.matches, dispose:()=>{
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();
    document.removeEventListener('visibilitychange',visibility);
    preference.removeEventListener('change',wake);
  }};
}
