import { convertToCoreMessages, smoothStream, streamText } from "ai";
import { selectThreadWithMessagesAction } from "../actions";
import { customModelProvider, requiresDefaultTemperature } from "lib/ai/models";
import { SUMMARIZE_PROMPT } from "lib/ai/prompts";
import logger from "logger";
import { ChatModel } from "app-types/chat";
import { redirect, RedirectType } from "next/navigation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { threadId, chatModel } = json as {
      threadId: string;
      chatModel?: ChatModel;
    };

    const thread = await selectThreadWithMessagesAction(threadId);

    if (!thread) redirect("/", RedirectType.replace);

    const messages = convertToCoreMessages(
      thread.messages
        .map((v) => ({
          content: "",
          role: v.role,
          parts: v.parts,
        }))
        .concat({
          content: "",
          parts: [
            {
              type: "text",
              text: "Generate a system prompt based on the conversation so far according to the rules.",
            },
          ],
          role: "user",
        }),
    );

    const model = customModelProvider.getModel(chatModel);
    const streamConfig: Parameters<typeof streamText>[0] = {
      model,
      system: SUMMARIZE_PROMPT,
      experimental_transform: smoothStream({ chunking: "word" }),
      messages,
    };

    // Only add temperature for models that support custom values
    if (!requiresDefaultTemperature(model)) {
      // streamConfig.temperature = 1;
    }

    const result = streamText(streamConfig);

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error(error);
  }
}
