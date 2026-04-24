import { generateObject } from 'ai'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import { extname } from 'path'
import { getModel, type Provider } from './providers.js'
import { pdfToMarkdown } from './pdf-to-md.js'

const ScreeningResult = z.object({
  passed: z.boolean().describe('Whether the candidate passes the screening'),
  score: z.number().min(0).max(100).describe('Overall match score from 0 to 100'),
  summary: z.string().describe('One-paragraph summary of the candidate'),
  strengths: z.array(z.string()).describe('Key strengths relevant to the criteria'),
  weaknesses: z.array(z.string()).describe('Key gaps or weaknesses against the criteria'),
  recommendation: z.string().describe('Concise hiring recommendation'),
})

export type ScreeningResult = z.infer<typeof ScreeningResult>

export async function loadResume(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.pdf') return pdfToMarkdown(filePath)
  return readFile(filePath, 'utf-8')
}

export async function loadCriteria(criteriaPath: string): Promise<string> {
  const content = await readFile(criteriaPath, 'utf-8')
  const ext = extname(criteriaPath).toLowerCase()
  if (ext === '.json') {
    // Validate it's parseable, then return formatted for the prompt
    const parsed = JSON.parse(content)
    return '```json\n' + JSON.stringify(parsed, null, 2) + '\n```'
  }
  return content
}

export async function screenResume(
  resumeContent: string,
  criteriaContent: string,
  provider: Provider,
  model?: string,
  baseUrl?: string,
): Promise<ScreeningResult> {
  const { object } = await generateObject({
    model: getModel(provider, model, baseUrl),
    schema: ScreeningResult,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert recruiter. Evaluate the resume strictly against the provided screening criteria and return a structured assessment.',
      },
      {
        role: 'user',
        content: `## Screening Criteria\n\n${criteriaContent}\n\n## Resume\n\n${resumeContent}`,
      },
    ],
  })

  return object
}
