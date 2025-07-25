// mcp-server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { handleChat } = require("./handlers/chat");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.post("/chat", async (req, res) => {
  try {
    const response = await handleChat(req.body);
    res.json(response);
  } catch (err) {
    console.error("Error handling /chat:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ MCP server listening on port ${PORT}`);
});
