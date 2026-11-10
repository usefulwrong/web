import {createCoatCloth} from './coat-cloth.mjs';
import {createStudyAnimation} from './study-animation.js';

export async function mountCoatCover(scene) {
  const canvas = scene.querySelector('canvas'), art = scene.querySelector('.ink-coat-art');
  const grab = scene.querySelector('.ink-coat-grab');
  const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: true});
  if (!gl) throw new Error('WebGL unavailable');
  const shader = (type, source) => {
    const value = gl.createShader(type); gl.shaderSource(value, source); gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error('Painting shader unavailable');
    return value;
  };
  const vertex = shader(gl.VERTEX_SHADER, `
    attribute vec3 position; attribute vec2 uv; attribute float light;
    varying vec2 textureUV; varying float shading;
    void main() {
      vec2 point = position.xy + vec2(position.z * .22, -position.z * .15);
      gl_Position = vec4(point.x / 768. - 1., 1. - point.y / 512., 0., 1.);
      textureUV = uv; shading = light;
    }`);
  const fragment = shader(gl.FRAGMENT_SHADER, `
    precision mediump float; uniform sampler2D painting;
    varying vec2 textureUV; varying float shading;
    void main() { vec4 color = texture2D(painting, textureUV); gl_FragColor = vec4(color.rgb * shading, color.a); }`);
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Painting program unavailable');
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (const [name, count, offset] of [['position', 3, 0], ['uv', 2, 12], ['light', 1, 20]]) {
    const attribute = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, count, gl.FLOAT, false, 24, offset);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const images = await Promise.all(['machine-v1.webp', 'coat-v1.webp'].map(async name => {
    const image = new Image(); image.src = new URL(`motion-ink/${name}`, import.meta.url).href; await image.decode(); return image;
  }));
  const textures = images.map(image => {
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); return texture;
  });
  const cloth = createCoatCloth(), vertices = new Float32Array(cloth.columns * cloth.rows * 36);
  let frames = 0, accumulator = 0, drag = null, suppressClick = 0, reducedPull = false;
  function paint(texture, data) {
    gl.bindTexture(gl.TEXTURE_2D, texture); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
  }
  function quad(x, y, w, h) {
    return new Float32Array([x,y,0,x/1536,y/1024,1, x+w,y,0,(x+w)/1536,y/1024,1, x,y+h,0,x/1536,(y+h)/1024,1,
      x+w,y,0,(x+w)/1536,y/1024,1, x+w,y+h,0,(x+w)/1536,(y+h)/1024,1, x,y+h,0,x/1536,(y+h)/1024,1]);
  }
  const machine = quad(0, 0, 1536, 1024), rail = quad(990, 150, 240, 94);
  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    paint(textures[0], machine);
    let offset = 0;
    const append = i => {
      const p = cloth.points[i], across = cloth.points[Math.min(i + 1, cloth.points.length - 1)];
      const shade = Math.max(.82, Math.min(1.13, 1 + (across.z - p.z) * .006));
      const pull = reducedPull ? 65 * (p.oy / 682) ** 2 : 0;
      for (const value of [1100 + p.x + pull, 123 + p.y, p.z, (1038 + p.ox / 315 * 410) / 1536, (100 + p.oy / 682 * 800) / 1024, shade]) vertices[offset++] = value;
    };
    for (let y = 0; y < cloth.rows; y++) for (let x = 0; x < cloth.columns; x++) {
      const a = y * (cloth.columns + 1) + x, b = a + 1, c = a + cloth.columns + 1, d = c + 1;
      for (const i of [a, b, c, b, d, c]) append(i);
    }
    paint(textures[1], vertices); paint(textures[0], rail);
    scene.dataset.paintFrame = String(++frames);
    scene.dataset.coatPull = String(Math.round(reducedPull ? 65 : Math.max(...cloth.points.map(p => Math.abs(p.x - p.ox)))));
  }
  const motion = createStudyAnimation(art, (dt, time, reduced) => {
    if (reduced) { cloth.reset(); draw(); return false; }
    reducedPull = false;
    accumulator = Math.min(accumulator + dt, .064);
    let active = true;
    while (accumulator >= 1 / 60) { active = cloth.step(); accumulator -= 1 / 60; }
    draw(); return active || Boolean(drag);
  });
  const resize = new ResizeObserver(() => {
    const box = art.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(box.width * ratio)); canvas.height = Math.max(1, Math.round(box.height * ratio)); draw();
  });
  resize.observe(art);
  const local = event => {
    const box = art.getBoundingClientRect();
    return {x: (event.clientX - box.left) / box.width * 1536 - 1100, y: (event.clientY - box.top) / box.height * 1024 - 123};
  };
  grab.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const p = local(event); drag = {id: event.pointerId, x: event.clientX, y: event.clientY, moved: false};
    cloth.hold(p.x, p.y); grab.setPointerCapture(event.pointerId);
  });
  grab.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
    const p = local(event); cloth.move(p.x, p.y);
    if (motion.reduced()) { reducedPull = drag.moved; } motion.wake();
  });
  const release = () => {
    if (drag?.moved) suppressClick = performance.now() + 500;
    drag = null; reducedPull = false; cloth.release(); motion.wake();
  };
  grab.addEventListener('pointerup', release); grab.addEventListener('pointercancel', release); grab.addEventListener('lostpointercapture', release);
  grab.addEventListener('click', event => {
    if (event.detail && performance.now() < suppressClick) return;
    if (motion.reduced()) reducedPull = !reducedPull; else cloth.impulse();
    motion.wake();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); motion.dispose(); scene.dataset.ready = art.dataset.ready = 'fallback'; grab.hidden = true; canvas.setAttribute('aria-hidden', 'true');
  });
  scene.dataset.ready = art.dataset.ready = 'true'; canvas.setAttribute('aria-hidden', 'false'); grab.hidden = false; draw();
  return () => { motion.dispose(); resize.disconnect(); textures.forEach(t => gl.deleteTexture(t)); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); };
}
