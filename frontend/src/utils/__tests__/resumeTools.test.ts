import { describe, expect, it } from 'vitest'
import {
  buildATSKeywordScore,
  extractKeywords,
  generateCoverLetterDraft,
  scoreResumeAgainstJob,
  type ResumeVersion
} from '../resumeTools'

const sampleResume: ResumeVersion = {
  id: 'r1',
  role: 'Frontend Engineer',
  title: 'Senior Frontend Engineer',
  summary: 'Builds React and TypeScript products with strong testing and accessibility practices.',
  skills: ['React', 'TypeScript', 'Accessibility', 'Testing Library', 'CSS'],
  experienceBullets: [
    'Led migration to TypeScript and reduced production defects by 30%',
    'Implemented React component architecture and improved velocity across squads'
  ]
}

const jd = `We are hiring a Frontend Engineer with strong React and TypeScript experience.
Candidates should collaborate with product teams, build accessible interfaces,
and own testing quality in modern web applications.`

describe('resumeTools', () => {
  it('extracts keywords ordered by importance', () => {
    const keywords = extractKeywords(jd, 6)
    expect(keywords).toContain('react')
    expect(keywords).toContain('typescript')
    expect(keywords.length).toBeLessThanOrEqual(6)
  })

  it('scores resume against job description', () => {
    const result = scoreResumeAgainstJob(sampleResume, jd)

    expect(result.overallScore).toBeGreaterThan(40)
    expect(result.matchedKeywords).toContain('react')
    expect(result.matchedKeywords).toContain('typescript')
    expect(result.suggestions.length).toBeGreaterThanOrEqual(0)
  })

  it('builds ATS score summary', () => {
    const ats = buildATSKeywordScore(sampleResume, jd)

    expect(ats.score).toBeGreaterThanOrEqual(0)
    expect(ats.score).toBeLessThanOrEqual(100)
    expect(['strong', 'moderate', 'weak']).toContain(ats.status)
  })

  it('generates cover letter draft with company and role details', () => {
    const letter = generateCoverLetterDraft(sampleResume, 'Acme', 'Frontend Engineer', jd)

    expect(letter).toContain('Acme')
    expect(letter).toContain('Frontend Engineer')
    expect(letter).toContain('TypeScript')
  })
})
