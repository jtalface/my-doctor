import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stateLoader } from '../state-loader';

describe('StateLoader session type entrypoints', () => {
  it('routes annual-checkup to annual_intro', () => {
    const initialState = stateLoader.getInitialStateForSessionType('annual-checkup');
    const node = stateLoader.getNode(initialState);

    assert.equal(initialState, 'annual_intro');
    assert.ok(node);
    assert.equal(node?.id, 'annual_intro');
  });

  it('routes symptom-check to symptom_intro', () => {
    const initialState = stateLoader.getInitialStateForSessionType('symptom-check');
    const node = stateLoader.getNode(initialState);

    assert.equal(initialState, 'symptom_intro');
    assert.ok(node);
    assert.equal(node?.id, 'symptom_intro');
  });

  it('routes medication-review to medication_intro', () => {
    const initialState = stateLoader.getInitialStateForSessionType('medication-review');
    const node = stateLoader.getNode(initialState);

    assert.equal(initialState, 'medication_intro');
    assert.ok(node);
    assert.equal(node?.id, 'medication_intro');
  });

  it('falls back to default initial state for unknown values', () => {
    const initialState = stateLoader.getInitialStateForSessionType('unknown-type' as any);
    const defaultState = stateLoader.getInitialState();

    assert.equal(initialState, defaultState);
    assert.equal(initialState, 'welcome');
  });
});
