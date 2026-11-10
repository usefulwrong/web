import test from 'node:test';
import assert from 'node:assert/strict';
import { courtFile, waitingFiles, initialCourtState, courtTransition } from '../site/assets/court-file-model.mjs';

test('an additional examiner receives the same selected context, not the original inspection', () => {
  assert.deepEqual(courtFile.examiner.inputs, courtFile.steward.inputs);
  assert.ok(courtFile.clerk.inputs.includes('inspection'));
  assert.ok(!courtFile.examiner.inputs.includes('inspection'));
  assert.match(courtFile.inspection.text.join(' '), /Keep the bridge closed/);
});

test('requesting a review does not authorise orders or claim the original was read', () => {
  const state = courtTransition(initialCourtState(), 'review');
  assert.equal(state.reviewed, true);
  assert.equal(state.decision, null);
  assert.equal(state.discovered, false);
});

test('the inbox is discovered through the source; delegation requires that discovery', () => {
  const start = initialCourtState();
  assert.deepEqual(courtTransition(start, 'delegate'), start);
  const inspected = courtTransition(start, 'inspect');
  const delegated = courtTransition(inspected, 'delegate');
  assert.equal(delegated.discovered, true);
  assert.equal(delegated.delegated, true);
  assert.equal(delegated.decision, null);
  assert.equal(new Set(waitingFiles.map(([title]) => title)).size, waitingFiles.length);
});

test('only an explicit decision issues or withholds the seal, and it cannot be silently reversed', () => {
  for (const [action, expected] of [['approve', 'approved'], ['withhold', 'withheld']]) {
    const state = courtTransition(initialCourtState(), action);
    assert.equal(state.decision, expected);
    assert.deepEqual(courtTransition(state, action === 'approve' ? 'withhold' : 'approve'), state);
    assert.equal(courtTransition(state, 'review').decision, expected);
  }
});

test('a deliberate restart clears the whole fictional session without mutating the previous state', () => {
  let state = initialCourtState();
  for (const action of ['review', 'inspect', 'approve', 'delegate']) state = courtTransition(state, action);
  assert.deepEqual(courtTransition(state, 'reset'), initialCourtState());
  assert.equal(state.decision, 'approved');
  assert.equal(state.delegated, true);
  assert.deepEqual(courtTransition(state, 'unknown'), state);
});
