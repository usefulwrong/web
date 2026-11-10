import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeLayers, pendingCases, decidePending, pendingCount, readCourtSession } from '../site/assets/court-desk-model.mjs';

test('each waiting envelope has its own recommendation and an inspectable source', () => {
  assert.equal(pendingCases.length, 24);
  assert.equal(new Set(pendingCases.map(item => item.id)).size, 24);
  for (const item of pendingCases) {
    assert.ok(item.title && item.office && item.recommendation && item.source);
    assert.notEqual(item.recommendation, item.source);
  }
  assert.equal(bridgeLayers[0].kind, 'royal');
  assert.match(bridgeLayers.at(-1).body.join(' '), /Keep the bridge closed/);
});

test('sealing or withholding an envelope resolves exactly one real pending file', () => {
  const start = {};
  assert.equal(pendingCount(start), 24);
  const first = decidePending(start, 0, 'approved');
  assert.equal(pendingCount(first), 23);
  assert.deepEqual(start, {});
  const second = decidePending(first, 12, 'withheld');
  assert.equal(pendingCount(second), 22);
  assert.equal(second[12], 'withheld');
  assert.deepEqual(decidePending(second, 0, 'withheld'), second);
});

test('unknown envelopes and invalid verdicts cannot change the desk count', () => {
  const state = { 2: 'approved' };
  for (const index of [-1, 24, 1000, NaN, '2', null]) assert.equal(decidePending(state, index, 'approved'), state);
  assert.equal(decidePending(state, 3, 'unknown'), state);
  assert.equal(pendingCount({ ...state, 1000: 'approved', invalid: 'withheld' }), 23);
});

test('the same reading session restores the royal decision, review, delegation and actual pending files', () => {
  const saved = { version: 1, state: { reviewed: true, discovered: true, decision: 'approved', delegated: true }, decisions: { 3: 'approved', 23: 'withheld' }, crowded: true };
  const restored = readCourtSession(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored, saved);
  assert.equal(pendingCount(restored.decisions), 22);
  restored.decisions[4] = 'withheld';
  assert.equal(saved.decisions[4], undefined);
});

test('invalid saved data cannot invent a decision, resolve unknown files or delegate without inspecting the source', () => {
  const empty = readCourtSession(null);
  for (const invalid of [null, [], 'saved', { version: 9 }]) assert.deepEqual(readCourtSession(invalid), empty);
  const forged = readCourtSession({ version: 1, state: { reviewed: 'yes', decision: 'killed', delegated: true }, crowded: true, decisions: { 1: 'approved' } });
  assert.deepEqual(forged, empty);
  const restored = readCourtSession({ version: 1, state: { discovered: true }, crowded: true, decisions: { '-1': 'approved', '24': 'approved', '01': 'approved', '2': 'withheld', '3': 'invalid', '__proto__': 'approved' } });
  assert.deepEqual(restored.decisions, { 2: 'withheld' });
});
