# Resume Screening Expert

A small CLI tool for screening resumes with LLMs.

It supports a simple two-step flow:

1. Convert PDF resumes to plain text
2. Evaluate resumes against screening criteria and return structured JSON

## Requirements

- Node.js 18+
- `pnpm`

## Install

```bash
pnpm install
```

## Environment Variables

Create a `.env` file in the project root. You can copy from `.env.example`.

```bash
cp .env.example .env
```

Available keys:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`

Only the key for the provider you actually use is required.

## Important: ChatGPT Plus vs API Key

`ChatGPT Plus` is not the same thing as `OpenAI API`.

- `ChatGPT Plus` gives you access to the ChatGPT product
- this project uses provider API keys
- for OpenAI provider, you still need an API key from `platform.openai.com`

## Project Structure

- `src/cli.ts` - CLI entry
- `src/pdf-to-md.ts` - PDF to text conversion
- `src/screener.ts` - resume loading and LLM screening
- `src/providers.ts` - provider/model setup
- `criteria/` - screening criteria files
- `resumes/` - input PDF resumes
- `resumes-md/` - converted markdown/text resumes
- `results/` - screening result JSON files

## CLI Usage

Run commands through:

```bash
pnpm dev <command> [options]
```

### 1. Convert PDF to text

```bash
pnpm dev convert resumes/example.pdf -o resumes-md/example.md
```

If `-o` is omitted, the output file is written to the current directory.

### 2. Screen a resume

```bash
pnpm dev screen resumes/example.pdf -c criteria/software-engineer.md
```

You can also screen an existing markdown/text resume:

```bash
pnpm dev screen resumes-md/example.md -c criteria/software-engineer.md
```

### Screen command options

```bash
pnpm dev screen <resume> \
  -c <criteria-file> \
  [-p anthropic|openai|deepseek] \
  [-m <model>] \
  [--base-url <url>] \
  [-o <result-json>]
```

Options:

- `-c, --criteria <file>` required, supports `.md` or `.json`
- `-p, --provider <provider>` optional, CLI default is `anthropic`
- `-m, --model <model>` optional, overrides the provider default model
- `-b, --base-url <url>` optional, overrides the provider API base URL
- `-o, --output <path>` optional, saves the structured result as JSON

## Supported Providers

### Anthropic

Default model:

- `claude-sonnet-4-6`

Example:

```bash
pnpm dev screen resumes/example.pdf \
  -c criteria/software-engineer.md \
  -p anthropic
```

With custom model and proxy:

```bash
pnpm dev screen resumes/example.pdf \
  -c criteria/software-engineer.md \
  -p anthropic \
  -m claude-sonnet-4-6 \
  --base-url https://your-proxy.example.com/v1
```

### OpenAI

Default model:

- `gpt-4o`

Example:

```bash
pnpm dev screen resumes/example.pdf \
  -c criteria/software-engineer.md \
  -p openai
```

### DeepSeek

Default model:

- `deepseek-v4-pro`

Example:

```bash
pnpm dev screen resumes/example.pdf \
  -c criteria/software-engineer.md \
  -p deepseek
```

Explicit model example:

```bash
pnpm dev screen resumes/example.pdf \
  -c criteria/software-engineer.md \
  -p deepseek \
  -m deepseek-v4-pro
```

By default DeepSeek uses:

```text
https://api.deepseek.com
```

`https://api.deepseek.com/v1` is still a compatible OpenAI-style path, but it is not tied to the model version.

This project uses JSON-mode structured output for DeepSeek because the AI SDK's default tool-calling object mode can fail against DeepSeek with errors like `tool_choice` unsupported.

You can override the base URL with `--base-url`.

## Batch Screening

The repository includes a helper script for screening all PDFs in `resumes/`.

Usage:

```bash
./batch-screen.sh [provider] [criteria] [model] [base-url]
```

Arguments:

- `provider` default: `deepseek`
- `criteria` default: `criteria/frontend-developer.md`
- `model` optional
- `base-url` optional

Examples:

```bash
./batch-screen.sh
```

This is equivalent to:

```bash
./batch-screen.sh deepseek criteria/frontend-developer.md deepseek-v4-pro
```

```bash
./batch-screen.sh openai criteria/software-engineer.md
```

```bash
./batch-screen.sh anthropic criteria/frontend-developer.md claude-sonnet-4-6
```

```bash
./batch-screen.sh anthropic criteria/frontend-developer.md claude-sonnet-4-6 https://your-proxy.example.com/v1
```

Outputs:

- converted resume text goes to `resumes-md/`
- screening result JSON goes to `results/`

The script also prints a simple ranking sorted by score.

## Criteria Files

Criteria files support:

- Markdown: free-form requirements and scoring guidance
- JSON: structured criteria data

Examples:

- `criteria/frontend-developer.md`
- `criteria/software-engineer.md`
- `criteria/frontend-developer.json`
- `criteria/software-engineer.json`

## Development

Type-check:

```bash
pnpm exec tsc --noEmit
```

Run the CLI:

```bash
pnpm dev screen resumes/example.pdf -c criteria/software-engineer.md -p openai
```

## Troubleshooting

- If DeepSeek returns an error mentioning `tool_choice`, the request is likely using tool-calling structured output instead of JSON-mode structured output.
- If you use a custom proxy, keep the model ID as `deepseek-v4-pro` and only override `--base-url`.
- `batch-screen.sh` defaults to DeepSeek, but the standalone `pnpm dev screen` command still defaults to `anthropic` unless you pass `-p deepseek`.
