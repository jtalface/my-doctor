import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveLegacyRiskFactors } from '../riskModifiers.js';
import { generateScreeningSchedule } from '../screeningRules.js';
import { getScreeningLocalization } from '../screeningLocalization.js';

test('deriveLegacyRiskFactors mirrors chronic / family / smoking / weight signals', () => {
  const rf = deriveLegacyRiskFactors({
    smokingStatus: 'current',
    weightCategory: 'normal',
    chronicConditions: ['chronic_hypertension', 'chronic_obesity'],
    familyHistory: ['fh_type2_diabetes', 'fh_cancer', 'fh_coronary_heart_disease'],
  });
  assert.equal(rf.smoker, true);
  assert.equal(rf.overweightOrObesity, true);
  assert.equal(rf.hypertension, true);
  assert.equal(rf.diabetesOrPrediabetes, true);
  assert.equal(rf.familyHistoryCancer, true);
  assert.equal(rf.familyHistoryCardiovascular, true);
});

test('deriveLegacyRiskFactors is false when no signals', () => {
  const rf = deriveLegacyRiskFactors({
    smokingStatus: 'never',
    weightCategory: 'normal',
    chronicConditions: [],
    familyHistory: [],
  });
  assert.deepEqual(rf, {
    smoker: false,
    overweightOrObesity: false,
    hypertension: false,
    diabetesOrPrediabetes: false,
    familyHistoryCancer: false,
    familyHistoryCardiovascular: false,
  });
});

test('Portuguese screening labels use European Portuguese orthography (accents)', () => {
  const pt = getScreeningLocalization('pt');
  assert.equal(pt.screening.vision.name, 'Avaliação da visão');
  assert.equal(pt.screening.lipid_panel.name, 'Perfil lipídico');
  assert.match(pt.disclaimer, /informação|avaliação|saúde/);
});

test('handles missing age conservatively', () => {
  const schedule = generateScreeningSchedule(
    { patientId: 'u1', sexAtBirth: 'female', language: 'pt' },
    {}
  );
  assert.ok(schedule.discussWithClinician.length >= 0);
  assert.equal(schedule.language, 'pt');
});

test('under 18 yields limited guidance', () => {
  const schedule = generateScreeningSchedule(
    { patientId: 'u1', sexAtBirth: 'male', age: 16, language: 'en' },
    {}
  );
  assert.equal(schedule.dueNow.length, 0);
  assert.ok(schedule.discussWithClinician.length >= 1);
});

test('high-risk hba1c becomes due now when never completed', () => {
  const schedule = generateScreeningSchedule(
    {
      patientId: 'u1',
      sexAtBirth: 'male',
      age: 50,
      chronicConditions: ['chronic_type2_diabetes'],
      language: 'en',
    },
    {}
  );
  const hba1c = schedule.dueNow.find((item) => item.code === 'hba1c');
  assert.ok(hba1c);
});

test('overdue detection for old completion', () => {
  const schedule = generateScreeningSchedule(
    { patientId: 'u1', sexAtBirth: 'female', age: 52, language: 'fr' },
    {
      blood_pressure: new Date('2021-01-01T00:00:00.000Z'),
    }
  );
  assert.ok(schedule.dueNow.some((item) => item.code === 'blood_pressure'));
});

test('elderly routes some items to discuss with clinician', () => {
  const schedule = generateScreeningSchedule(
    { patientId: 'u1', sexAtBirth: 'female', age: 78, language: 'sw' },
    {}
  );
  assert.ok(schedule.discussWithClinician.length > 0);
});
