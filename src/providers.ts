import { anthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

export type Provider = 'anthropic' | 'openai' | 'deepseek'

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

// DeepSeek is OpenAI API-compatible
const deepseekProvider = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
}

export function getModel(provider: Provider, model?: string) {
  const modelId = model ?? DEFAULT_MODELS[provider]
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId)
    case 'openai':
      return openaiProvider(modelId)
    case 'deepseek':
      return deepseekProvider(modelId)
  }
}
