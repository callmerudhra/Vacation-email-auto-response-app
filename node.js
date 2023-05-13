const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const gmail = google.gmail("v1");
const fs = require("fs").promises;
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const TOKEN_PATH = "token.json";

// Function to authorize and authenticate with the Gmail API
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    console.log("Error reading token file:", err);
    return getNewToken(oAuth2Client);
  }
}

// Function to get a new access token from Google's OAuth2 service
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const code = await new Promise((resolve, reject) => {
    readline.question("Enter the code from that page here: ", (code) => {
      resolve(code);
    });
  });
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Token stored to", TOKEN_PATH);
    return oAuth2Client;
  } catch (err) {
    console.log("Error retrieving access token:", err);
  }
}

// Function to create a new Gmail label
async function createLabel(auth, labelName) {
  const label = {
    name: labelName,
  };
  try {
    await gmail.users.labels.create({
      auth: auth,
      userId: "me",
      resource: label,
    });
    console.log(`Label ${labelName} created.`);
  } catch (err) {
    console.log(`Error creating label ${labelName}:`, err);
  }
}

// Function to check if an email has been replied to before
async function hasBeenRepliedTo(auth, threadId) {
  try {
    const thread = await gmail.users.threads.get({
      auth: auth,
      userId: "me",
      id: threadId,
    });
    const messages = thread.data.messages;
    const message = messages[messages.length - 1];
    const headers = message.payload.headers;
    const from = headers.find((h) => h.name === "From").value;
    const to = headers.find((h) => h.name === "To").value;
    const subject = headers.find((h) => h.name === "Subject").value;
    const hasBeenRepliedTo = headers.some((h) => h.name === "In-Reply-To");
    return {
      from,
      to,
      subject,
      hasBeenRepliedTo,
    };
  } catch (err) {
    console.log("Error checking if email has been replied to:", err);
  }
}

// Function to send an auto reply to a new email
async function sendAutoReply(auth, message, labelName) {
  try {
    const threadId = message.threadId;
    const { from, to, subject } = await hasBeenRepliedTo(auth, threadId);
    if (from && to && subject && !hasBeenRepliedTo) {
      const messageParts = [
        `Hi ${from.split(" ")[0]},`,
        "",
        "Thank you for your email. I am currently out of office and will",
        `not be checking my email until ${labelName}.`,
        "",
        "Best regards,",
        "Your Name",
      ];
      const autoReply = messageParts.join("\n");
      const modifiedMessage = {
        ...message,
        payload: {
          ...message.payload,
          body: {
            ...message.payload.body,
            data: Buffer.from(autoReply).toString("base64"),
          },
          labelIds: [...message.payload.labelIds, labelName],
        },
      };
      await gmail.users.messages.send({
        auth: auth,
        userId: "me",
        resource: modifiedMessage,
      });

      // Send the auto-reply to your own email address
      const selfEmail = "bnagarudhra@gmail.com";
      const selfMessage = {
        to: selfEmail,
        subject: `Auto-reply sent to ${from}`,
        body: autoReply,
      };
      const selfModifiedMessage = {
        raw: Buffer.from(
          `To: ${selfMessage.to}\r\n` +
            `Subject: ${selfMessage.subject}\r\n` +
            `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
            `${selfMessage.body}`
        ).toString("base64"),
      };
      await gmail.users.messages.send({
        auth: auth,
        userId: "me",
        resource: selfModifiedMessage,
      });

      console.log(`Auto reply sent to ${from}.`);
    }
  } catch (err) {
    console.log("Error sending auto reply:", err);
  }
}
