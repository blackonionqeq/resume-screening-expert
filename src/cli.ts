#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import chalk from 'chalk'
import { writeFile } from 'fs/promises'
import { convertAndSave } from './pdf-to-md.js'
import { loadResume, loadCriteria, screenResume } from './screener.js'
import type { Provider } from './providers.js'

const program = new Command()

program
  .name('resume-screen')
  .description('AI-powered resume screening tool')
  .version('1.0.0')

program
  .command('convert <pdf>')
  .description('Convert a PDF resume to a markdown text file')
  .option('-o, --output <path>', 'output file path')
  .action(async (pdf: string, options: { output?: string }) => {
    console.log(chalk.blue('Converting PDF...'))
    try {
      const outPath = await convertAndSave(pdf, options.output)
      console.log(chalk.green(`✓ Saved to ${outPath}`))
    } catch (err) {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

program
  .command('screen <resume>')
  .description('Screen a resume (PDF or MD) against a criteria file')
  .requiredOption('-c, --criteria <file>', 'criteria file (.md or .json)')
  .option('-p, --provider <provider>', 'LLM provider: anthropic | openai | deepseek', 'anthropic')
  .option('-m, --model <model>', 'override the default model for the provider')
  .option('-o, --output <path>', 'save JSON result to a file')
  .action(async (
    resume: string,
    options: { criteria: string; provider: string; model?: string; output?: string },
  ) => {
    const provider = options.provider as Provider
    const validProviders: Provider[] = ['anthropic', 'openai', 'deepseek']
    if (!validProviders.includes(provider)) {
      console.error(chalk.red(`Unknown provider "${provider}". Choose from: ${validProviders.join(', ')}`))
      process.exit(1)
    }

    try {
      process.stdout.write(chalk.blue('Loading resume... '))
      const resumeContent = await loadResume(resume)
      console.log(chalk.green('done'))

      process.stdout.write(chalk.blue('Loading criteria... '))
      const criteriaContent = await loadCriteria(options.criteria)
      console.log(chalk.green('done'))

      process.stdout.write(chalk.blue(`Screening with ${provider}... `))
      const result = await screenResume(resumeContent, criteriaContent, provider, options.model)
      console.log(chalk.green('done'))

      console.log('\n' + chalk.bold.underline('Screening Result'))
      console.log(
        chalk.bold('Decision: ') +
          (result.passed ? chalk.green('PASS ✓') : chalk.red('FAIL ✗')),
      )
      console.log(chalk.bold(`Score:    `) + `${result.score}/100`)
      console.log(chalk.bold('Summary:  ') + result.summary)

      console.log('\n' + chalk.bold('Strengths:'))
      result.strengths.forEach((s) => console.log(chalk.green(`  + ${s}`)))

      console.log('\n' + chalk.bold('Weaknesses:'))
      result.weaknesses.forEach((w) => console.log(chalk.red(`  - ${w}`)))

      console.log('\n' + chalk.bold('Recommendation:'))
      console.log(`  ${result.recommendation}`)

      if (options.output) {
        await writeFile(options.output, JSON.stringify(result, null, 2), 'utf-8')
        console.log(chalk.green(`\n✓ Result saved to ${options.output}`))
      }
    } catch (err) {
      console.error(chalk.red('\nError:'), err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  })

program.parse()
