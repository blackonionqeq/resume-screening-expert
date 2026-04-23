import { extractText, getDocumentProxy } from 'unpdf'
import { readFile, writeFile } from 'fs/promises'
import { resolve, basename, extname } from 'path'

export async function pdfToMarkdown(pdfPath: string): Promise<string> {
  const buffer = await readFile(pdfPath)
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

export async function convertAndSave(pdfPath: string, outputPath?: string): Promise<string> {
  const markdown = await pdfToMarkdown(pdfPath)
  const outPath = outputPath ?? resolve(process.cwd(), basename(pdfPath, extname(pdfPath)) + '.md')
  await writeFile(outPath, markdown, 'utf-8')
  return outPath
}
