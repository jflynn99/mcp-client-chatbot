// Model display metadata for enhanced UI
export interface ModelMetadata {
  displayName: string;
  badge?: "Latest" | "Best" | "Fast" | "Voice" | "Image" | "New";
  description?: string;
}

export const MODEL_METADATA: Record<string, Record<string, ModelMetadata>> = {
  openai: {
    "gpt-5": {
      displayName: "GPT-5",
      badge: "Best",
      description: "Latest flagship model with state-of-the-art performance",
    },
    "gpt-5.1": {
      displayName: "GPT-5.1",
      badge: "Latest",
      description: "Best for agentic and coding tasks",
    },
    "gpt-5-mini": {
      displayName: "GPT-5 Mini",
      badge: "Fast",
      description: "Cost-effective flagship model",
    },
    "gpt-4.1": {
      displayName: "GPT-4.1",
      description: "Advanced reasoning and coding",
    },
    "gpt-4.1-mini": {
      displayName: "GPT-4.1 Mini",
      description: "Efficient mid-tier model",
    },
    "gpt-4.1-nano": {
      displayName: "GPT-4.1 Nano",
      badge: "Fast",
      description: "Smallest GPT-4.1 variant",
    },
    "gpt-4o": {
      displayName: "GPT-4o",
      description: "Multimodal flagship (legacy)",
    },
    "gpt-4o-mini": {
      displayName: "GPT-4o Mini",
      description: "Fast and affordable",
    },
    "o4-mini": {
      displayName: "o4-mini",
      description: "Reasoning model (no tools)",
    },
    "gpt-realtime": {
      displayName: "GPT Realtime",
      badge: "Voice",
      description: "For voice interactions",
    },
  },
  anthropic: {
    "claude-opus-4.5": {
      displayName: "Claude Opus 4.5",
      badge: "Best",
      description: "Most intelligent Claude model",
    },
    "claude-sonnet-4.5": {
      displayName: "Claude Sonnet 4.5",
      badge: "Latest",
      description: "Best for coding and agents",
    },
    "claude-haiku-4.5": {
      displayName: "Claude Haiku 4.5",
      badge: "Fast",
      description: "Fast and efficient",
    },
    "claude-3.7-sonnet": {
      displayName: "Claude 3.7 Sonnet",
      description: "Legacy model with reasoning",
    },
  },
  google: {
    "gemini-3-pro": {
      displayName: "Gemini 3 Pro",
      badge: "Latest",
      description: "Latest Google flagship",
    },
    "gemini-3-pro-image": {
      displayName: "Gemini 3 Pro Image",
      badge: "Image",
      description: "Image generation model",
    },
    "gemini-2.5-pro": {
      displayName: "Gemini 2.5 Pro",
      description: "High-capability model",
    },
    "gemini-2.5-flash": {
      displayName: "Gemini 2.5 Flash",
      badge: "Fast",
      description: "Fast and balanced",
    },
    "gemini-2.5-flash-lite": {
      displayName: "Gemini 2.5 Flash Lite",
      description: "Lightweight and fast",
    },
    "gemini-2.5-computer-use": {
      displayName: "Gemini 2.5 Computer Use",
      description: "For UI automation",
    },
    "gemini-2.0-flash-lite": {
      displayName: "Gemini 2.0 Flash Lite",
      description: "Legacy lightweight model",
    },
  },
  xai: {
    "grok-3": {
      displayName: "Grok 3",
      badge: "Latest",
      description: "Latest Grok model",
    },
    "grok-3-mini": {
      displayName: "Grok 3 Mini",
      badge: "Fast",
      description: "Faster Grok variant",
    },
  },
  ollama: {
    "gemma3:1b": {
      displayName: "Gemma3 1B",
      description: "Local model",
    },
    "gemma3:4b": {
      displayName: "Gemma3 4B",
      description: "Local model",
    },
    "gemma3:12b": {
      displayName: "Gemma3 12B",
      description: "Local model",
    },
  },
  openRouter: {
    "qwen3-8b:free": {
      displayName: "Qwen3 8B (Free)",
      description: "Free community model",
    },
    "qwen3-14b:free": {
      displayName: "Qwen3 14B (Free)",
      description: "Free community model",
    },
  },
};

export function getModelDisplayName(provider: string, model: string): string {
  return MODEL_METADATA[provider]?.[model]?.displayName || model;
}

export function getModelMetadata(
  provider: string,
  model: string,
): ModelMetadata | undefined {
  return MODEL_METADATA[provider]?.[model];
}
