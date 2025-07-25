const { OpenAI } = require("openai");
const { listStarredEmails } = require("../tools/readGmail");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handleChat(payload) {
  const {
    system_prompt,
    messages,
    model_id = "gpt-4",
    context_vars = {},
    tool_calls = [],
  } = payload;

  const chatMessages = [
    ...(system_prompt ? [{ role: "system", content: system_prompt }] : []),
    ...messages,
  ];

  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase();
  console.log("🧠 Last user message:", lastUserMessage);

  // 🛠 Tool use block: check for email-related queries
  if (
    lastUserMessage?.includes("email") ||
    lastUserMessage?.includes("starred")
  ) {
    console.log("📩 Handling email tool logic...");

    const match = lastUserMessage.match(
      /emails? (about|with subject|from) (.+)/i,
    );
    const keyword = match ? match[2] : "";

    const emails = await listStarredEmails(keyword);
    const summary = emails
      .map(
        (e, i) =>
          `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Snippet: ${e.snippet}`,
      )
      .join("\n\n");

    const systemPrompt = `
You are an assistant with access to the user's ⭐ starred Gmail emails.
The user is asking about "${keyword || "all"}" emails.
Here is a list of matching emails:

${summary}

Answer the user's question based on this.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: model_id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: lastUserMessage },
      ],
      temperature: 0.7,
    });

    return {
      reply: completion.choices[0].message,
    };
  }

  // 🔁 Fallback to normal GPT response
  const completion = await openai.chat.completions.create({
    model: model_id,
    messages: chatMessages,
    temperature: 0.7,
  });

  return {
    reply: completion.choices[0].message,
  };
}

module.exports = { handleChat };
