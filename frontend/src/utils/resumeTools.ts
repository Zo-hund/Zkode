export interface ResumeVersion {
  id: string
  role: string
  title: string
  summary: string
  skills: string[]
  experienceBullets: string[]
}

export interface MatchResult {
  overallScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'you', 'your', 'are', 'have', 'has', 'was',
  'were', 'will', 'our', 'their', 'about', 'into', 'over', 'under', 'more', 'than', 'using', 'use',
  'required', 'preferred', 'ability', 'years', 'year', 'experience', 'work', 'team', 'role'
])

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s+#.-]/g, ' ').replace(/\s+/g, ' ').trim()

const tokenize = (text: string) =>
  normalize(text)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

export const extractKeywords = (jobDescription: string, maxKeywords = 30): string[] => {
  const frequencies = new Map<string, number>()

  tokenize(jobDescription).forEach((token) => {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1)
  })

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([keyword]) => keyword)
}

const resumeCorpus = (resume: ResumeVersion) => [
  resume.role,
  resume.title,
  resume.summary,
  ...resume.skills,
  ...resume.experienceBullets
].join(' ')

export const scoreResumeAgainstJob = (resume: ResumeVersion, jobDescription: string): MatchResult => {
  const jdKeywords = extractKeywords(jobDescription)
  const resumeTokens = new Set(tokenize(resumeCorpus(resume)))

  const matchedKeywords = jdKeywords.filter((keyword) => resumeTokens.has(keyword))
  const missingKeywords = jdKeywords.filter((keyword) => !resumeTokens.has(keyword))

  const keywordScore = jdKeywords.length === 0 ? 0 : (matchedKeywords.length / jdKeywords.length) * 100
  const skillOverlap = resume.skills.length === 0
    ? 0
    : (resume.skills.filter((skill) => resumeTokens.has(normalize(skill))).length / resume.skills.length) * 100

  const overallScore = Math.round(keywordScore * 0.75 + skillOverlap * 0.25)

  return {
    overallScore,
    matchedKeywords,
    missingKeywords,
    suggestions: missingKeywords.slice(0, 5).map((keyword) => `Add impact evidence using keyword: "${keyword}"`)
  }
}

export const buildATSKeywordScore = (resume: ResumeVersion, jobDescription: string) => {
  const result = scoreResumeAgainstJob(resume, jobDescription)

  return {
    score: result.overallScore,
    status: result.overallScore >= 80 ? 'strong' : result.overallScore >= 60 ? 'moderate' : 'weak',
    matchedCount: result.matchedKeywords.length,
    missingCount: result.missingKeywords.length,
    topMissingKeywords: result.missingKeywords.slice(0, 10)
  }
}

export const generateCoverLetterDraft = (
  resume: ResumeVersion,
  companyName: string,
  jobTitle: string,
  jobDescription: string
) => {
  const { matchedKeywords } = scoreResumeAgainstJob(resume, jobDescription)
  const highlightedSkills = resume.skills.slice(0, 4).join(', ')
  const focusKeywords = matchedKeywords.slice(0, 5).join(', ')

  return `Dear Hiring Team at ${companyName},

I am excited to apply for the ${jobTitle} position. I bring experience as a ${resume.title} focused on ${resume.role}, with hands-on delivery in ${highlightedSkills}.

In recent work, I have driven measurable outcomes by refining systems, improving execution quality, and collaborating closely across teams. My background aligns strongly with your needs around ${focusKeywords || 'high-impact execution and cross-functional delivery'}.

I would value the opportunity to contribute immediately while continuing to grow with your team. Thank you for your consideration.

Sincerely,
A motivated candidate`
}
