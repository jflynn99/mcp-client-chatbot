const { listUnreadEmails } = require("./readGmail");

listUnreadEmails()
  .then((emails) => {
    console.log("\n📬 Unread emails:\n", emails);
  })
  .catch((err) => {
    console.error("❌ Error reading emails:", err.message);
  });
