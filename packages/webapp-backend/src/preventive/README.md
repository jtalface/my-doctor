# Preventive Health Screening Schedule

This module provides deterministic preventive screening schedules using profile inputs and completion history.

## Medical guideline updates

Update these files:

- `screeningIntervals.ts`: baseline interval windows and due-soon thresholds
- `riskModifiers.ts`: high-risk and override logic
- `screeningRules.ts`: applicability, age gates, and due-state classification
- `screeningLocalization.ts`: per-language screening rationale and risk notes

Guideline changes should always include:

1. A unit test update in `__tests__/screeningRules.test.ts`
2. A seed update check in `seed.ts` if interval defaults changed
3. A localization review for all supported languages

## Localization architecture

- API-driven localized schedule text is generated from `screeningLocalization.ts`.
- Frontend UI shell strings are stored in:
  - `packages/webapp/src/i18n/pt-PT.json`
  - `packages/webapp/src/i18n/en.json`
  - `packages/webapp/src/i18n/fr.json`
  - `packages/webapp/src/i18n/sw.json`
- Runtime language selection uses user preference in DB and localStorage fallback (`mydoctor_language`).
- Default language is Portuguese (`pt`).

## Adding a new language

1. Add language code to supported language config (`packages/webapp/src/config/languages.ts`).
2. Add frontend dictionary file in `packages/webapp/src/i18n/`.
3. Extend `packages/webapp/src/i18n/preventive.ts` bundle map.
4. Add backend localization entries in `screeningLocalization.ts`.
5. Add integration tests to ensure fallback behavior still works.

## Safety statement

The feature is informational and non-diagnostic.

Portuguese disclaimer:

`Esta informação não substitui a avaliação por um profissional de saúde.`
