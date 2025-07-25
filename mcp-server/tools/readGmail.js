const { google } = require("googleapis");

async function listStarredEmails(limit = 20, subjectKeyword = "") {
  const credentials = JSON.parse(process.env.GMAIL_CREDENTIALS_JSON);
  const token = JSON.parse(process.env.GMAIL_TOKEN_JSON);

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  oAuth2Client.setCredentials(token);
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const q = `is:starred${subjectKeyword ? ` ${subjectKeyword}` : ""}`;
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: limit,
    q,
  });

  if (!res.data.messages) return [];

  const emails = await Promise.all(
    res.data.messages.map(async (msg) => {
      const { data } = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });
      const headers = data.payload.headers;
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No subject";
      const from =
        headers.find((h) => h.name === "From")?.value || "Unknown sender";
      const snippet = data.snippet;
      return { subject, from, snippet };
    }),
  );

  return emails;
}

module.exports = { listStarredEmails };
