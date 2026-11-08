import { describe, expect, it } from 'vitest'
import { LANGS } from './content/data'
import { normalizePersisted } from './store/persisted'
import core from './games/dealboard/content/core.json'
import play from './games/dealboard/content/play.json'
import learn from './games/dealboard/content/learn.json'
import lessons from './games/dealboard/content/lessons.json'
import judgement from './games/dealboard/content/judgement.json'

const strings = (value: unknown): string[] => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []

describe('English-only product', () => {
  it('supports only English and preserves progress when loading an obsolete language setting', () => {
    expect(LANGS).toEqual(['en'])
    const previous = normalizePersisted({ persona: 'college', storySeen: true, classCode: 'HYD-K7Q2M', rollNo: '0023' }, () => 'same-player')
    const migrated = normalizePersisted({ ...previous, language: 'obsolete-language' })
    expect(migrated).toEqual({ ...previous, language: 'en' })
  })
  it('ships English investing text with no non-English script hidden in the main bundles', () => {
    expect(core.title).toBe('Deal Board')
    for (const line of strings({ core, play, learn, lessons, judgement })) {
      expect(line).not.toMatch(/[\u0900-\u097f\u0c00-\u0cff]/u)
    }
  })
})
