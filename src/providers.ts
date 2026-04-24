import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

export type Provider = 'anthropic' | 'openai' | 'deepseek'

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
}

export function getModel(provider: Provider, model?: string, baseUrl?: string) {
  const modelId = model ?? DEFAULT_MODELS[provider]
  switch (provider) {
    case 'anthropic':
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? '',
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      })(modelId)
    case 'openai':
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? '',
        ...(baseUrl ? { baseURL: baseUrl } : {}),
      })(modelId)
    case 'deepseek':
      return createOpenAI({
        baseURL: baseUrl ?? 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY ?? '',
      })(modelId)
  }
}
