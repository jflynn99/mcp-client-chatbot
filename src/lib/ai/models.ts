// models.ts
import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

const staticModels = {
  openai: {
    // Latest GPT-5 family (November 2025)
    "gpt-5": openai("gpt-5"),
    "gpt-5.1": openai("gpt-5.1"),
    "gpt-5-mini": openai("gpt-5-mini"),
    // GPT-4.1 family
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "gpt-4.1-nano": openai("gpt-4.1-nano"),
    // GPT-4o family (legacy but still useful)
    "gpt-4o": openai("gpt-4o"),
    "gpt-4o-mini": openai("gpt-4o-mini"),
    // o-series reasoning models
    "o4-mini": openai("o4-mini", {
      reasoningEffort: "medium",
    }),
    // Realtime model for voice
    "gpt-realtime": openai("gpt-realtime"),
  },
  google: {
    // Latest Gemini 3 (November 2025)
    "gemini-3-pro": google("gemini-3-pro"),
    "gemini-3-pro-image": google("gemini-3-pro-image"),
    // Gemini 2.5 family (current production)
    "gemini-2.5-pro": google("gemini-2.5-pro"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
    "gemini-2.5-computer-use": google("gemini-2.5-computer-use"),
    // Legacy
    "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
  },
  anthropic: {
    // Latest Claude 4.5 family (November 2025)
    "claude-opus-4.5": anthropic("claude-opus-4-5-20251101"),
    "claude-sonnet-4.5": anthropic("claude-sonnet-4-5-20250929"),
    "claude-haiku-4.5": anthropic("claude-haiku-4-5-20251015"),
    // Legacy Claude 3.7
    "claude-3.7-sonnet": anthropic("claude-3-7-sonnet-20250224"),
  },
  xai: {
    "grok-3": xai("grok-3-latest"),
    "grok-3-mini": xai("grok-3-mini-latest"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  openRouter: {
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
  },
};

const staticUnsupportedModels = new Set([
  // Reasoning models don't support tool calls
  staticModels.openai["o4-mini"],
  // Lite/small models with limited capabilities
  staticModels.google["gemini-2.0-flash-lite"],
  staticModels.google["gemini-2.5-flash-lite"],
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  staticModels.openRouter["qwen3-8b:free"],
  staticModels.openRouter["qwen3-14b:free"],
  // Specialized models (image generation, computer use, voice)
  staticModels.google["gemini-3-pro-image"],
  staticModels.google["gemini-2.5-computer-use"],
  staticModels.openai["gpt-realtime"],
]);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const firstProvider = Object.keys(allModels)[0];
const firstModel = Object.keys(allModels[firstProvider])[0];

const fallbackModel = allModels[firstProvider][firstModel];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
    })),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};
