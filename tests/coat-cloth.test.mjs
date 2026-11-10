import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCoatCloth} from '../site/assets/coat-cloth.mjs';

function settle(cloth) {
  for (let i = 0; i < 600; i++) if (!cloth.step()) return;
  assert.fail('The drawing must stop updating after the fabric settles');
}

test('The coat rests without motion, bends under a pull, and stays on the rail', () => {
  const cloth = createCoatCloth();
  assert.equal(cloth.step(), false);
  cloth.hold(250, 550); cloth.move(900, -500);
  for (let i = 0; i < 180; i++) cloth.step();
  assert.ok(cloth.points.some(p => Math.abs(p.x - p.ox) > 20));
  for (const p of cloth.points) {
    assert.ok([p.x, p.y, p.z].every(Number.isFinite));
    assert.ok(Math.abs(p.x - p.ox) < 150);
    if (p.pinned) assert.deepEqual([p.x, p.y, p.z], [p.ox, p.oy, 0]);
  }
  cloth.release(); settle(cloth);
  for (const p of cloth.points) assert.deepEqual([p.x, p.y, p.z], [p.ox, p.oy, 0]);
});

test('Keyboard impulses settle; reset releases a held point', () => {
  const cloth = createCoatCloth();
  cloth.impulse(); cloth.step();
  assert.ok(cloth.points.some(p => p.z !== 0));
  settle(cloth);
  cloth.hold(100, 500); cloth.move(200, 500); cloth.step(); cloth.reset();
  assert.equal(cloth.step(), false);
});
