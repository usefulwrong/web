import {createStudyAnimation} from './study-animation.js';

const assets='../assets/motion-ink/';
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

function loadImage(name){
  const image=new Image();image.decoding='async';image.src=assets+name;
  return image.decode().then(()=>image);
}

export function mountInkPainting(panel){
  const scene=panel;
  const tug=panel.querySelector('#ink-tug');
  const canvas=panel.querySelector('canvas');
  const context=canvas.getContext('2d');
  const art=panel.querySelector('.ink-coat-art');
  const state={x:0,y:0,vx:0,vy:0,tx:0,ty:0,ready:false,disposed:false,drag:null,lastPaint:0,frames:0,suppressClickUntil:0};
  let machine,coat;
  // These rectangles align the separated painting layers; they do not model a body or a workout.
  const source={x:1038,y:100,w:410,h:800};
  const destination={x:1100,y:123,w:315,h:682};
  function draw(time=0){
    if(!state.ready||!context)return;
    context.setTransform(canvas.width/1536,0,0,canvas.height/1024,0,0);
    context.clearRect(0,0,1536,1024);context.drawImage(machine,0,0,1536,1024);
    const stretch=1+state.y/destination.h;
    for(let row=0;row<source.h;row+=8){
      const h=Math.min(8,source.h-row),t=row/source.h,pin=Math.max(0,(t-.14)/.86),shift=state.x*pin*pin;
      context.drawImage(coat,source.x,source.y+row,source.w,h,destination.x+shift,destination.y+row*destination.h/source.h*stretch,destination.w,(h+1)*destination.h/source.h*stretch);
    }
    // The front handrail passes in front of the shoulder, as it does in the original drawing.
    context.drawImage(machine,990,150,240,94,990,150,240,94);
    scene.dataset.coatPull=String(Math.round(state.x));scene.dataset.paintFrame=String(++state.frames);
  }
  const motion=createStudyAnimation(scene,(dt,time,reduced)=>{
    if(reduced){state.x=state.tx;state.y=state.ty;draw();return false;}
    state.vx+=((state.tx-state.x)*65-state.vx*12)*dt;
    state.vy+=((state.ty-state.y)*65-state.vy*12)*dt;
    state.x+=state.vx*dt;state.y+=state.vy*dt;
    const active=Math.abs(state.vx)+Math.abs(state.vy)+Math.abs(state.x-state.tx)+Math.abs(state.y-state.ty)>.15;
    if(time-state.lastPaint>.025||!active){draw(time);state.lastPaint=time;}
    return active;
  });
  function resize(){
    const rect=art.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));
    motion.wake();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(art);
  Promise.all([loadImage('machine-v1.webp'),loadImage('coat-v1.webp')]).then(images=>{
    if(state.disposed)return;
    if(!context)throw new Error('Canvas unavailable');
    [machine,coat]=images;state.ready=true;resize();draw();scene.dataset.ready='true';
    canvas.setAttribute('aria-hidden','false');tug.hidden=false;
  }).catch(()=>{
    if(state.disposed)return;
    scene.dataset.ready='fallback';tug.hidden=true;
  });
  tug.addEventListener('click',event=>{
    if(event.detail!==0&&performance.now()<state.suppressClickUntil)return;
    if(motion.reduced())state.tx=state.tx?0:65;
    else {state.vx+=950;state.vy-=120;}
    motion.wake();
  });
  const grab=panel.querySelector('.ink-coat-grab');
  const world=event=>{const rect=art.getBoundingClientRect();return{x:(event.clientX-rect.left)*1536/rect.width,y:(event.clientY-rect.top)*1024/rect.height};};
  grab.addEventListener('pointerdown',event=>{
    if(event.button!==0||!state.ready)return;
    state.drag={id:event.pointerId,start:world(event),moved:false};grab.setPointerCapture(event.pointerId);
  });
  grab.addEventListener('pointermove',event=>{
    if(!state.drag||state.drag.id!==event.pointerId)return;
    const next=world(event);state.tx=clamp(next.x-state.drag.start.x,-105,105);state.ty=clamp(next.y-state.drag.start.y,-40,45);
    if(Math.abs(state.tx)+Math.abs(state.ty)>8)state.drag.moved=true;
    motion.wake();
  });
  const release=event=>{
    if(event.type==='pointerup'&&state.drag?.moved&&grab===tug)state.suppressClickUntil=performance.now()+400;
    state.drag=null;state.tx=state.ty=0;motion.wake();
  };
  grab.addEventListener('pointerup',release);grab.addEventListener('pointercancel',release);
  return()=>{state.disposed=true;motion.dispose();resizeObserver.disconnect();};
}
