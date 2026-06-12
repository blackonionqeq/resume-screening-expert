# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Type-check
pnpm tsc --noEmit

# Run CLI (development)
pnpm dev <command> [options]

# Examples
pnpm dev convert resume.pdf -o resume.md
pnpm dev screen resume.pdf -c criteria/software-engineer.md -p anthropic
pnpm dev screen resume.pdf -c criteria/software-engineer.md -p openai -m gpt-4o-mini -o result.json
```

Always use `pnpm` — never `npm`.

## Architecture

The tool is a two-step pipeline: PDF → text, then text → structured LLM evaluation.

**`src/cli.ts`** — Entry point. Defines two Commander commands (`convert`, `screen`), loads `.env` via `dotenv/config`, handles all user-facing output with `chalk`.

**`src/pdf-to-md.ts`** — Wraps `unpdf` (`getDocumentProxy` + `extractText`) to pull plain text out of a PDF. No layout preservation — content only.

**`src/screener.ts`** — Core logic. `loadResume` dispatches to `pdfToMarkdown` or `fs.readFile` based on extension. `loadCriteria` reads `.md` or `.json` criteria files. `screenResume` calls the Vercel AI SDK's `generateObject` with a Zod schema to get a typed, structured result (`passed`, `score`, `summary`, `strengths`, `weaknesses`, `recommendation`).

**`src/providers.ts`** — Provider factory. Anthropic uses `@ai-sdk/anthropic`. OpenAI uses `@ai-sdk/openai`. DeepSeek reuses `createOpenAI` from `@ai-sdk/openai` with `baseURL: 'https://api.deepseek.com/v1'` (OpenAI-compatible API). Default models: `Codex-sonnet-4-6`, `gpt-4o`, `deepseek-chat`.

**`criteria/`** — Screening criteria files. Supports `.md` (free-form prompt) and `.json` (structured). Both are passed as plain text into the LLM prompt. Add new roles here.

## Environment

Copy `.env.example` to `.env` and fill in the keys you need:
- `ANTHROPIC_API_KEY` — for `-p anthropic`
- `OPENAI_API_KEY` — for `-p openai`
- `DEEPSEEK_API_KEY` — for `-p deepseek`
