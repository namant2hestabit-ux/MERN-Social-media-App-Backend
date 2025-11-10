const { google } = require("googleapis");
// dotenv is intentionally NOT auto-invoked here so unit tests can control process.env
const dotenv = require("dotenv");

// Export a getter so tests can mutate process.env before requiring this module.
Object.defineProperty(exports, "oauth2client", {
  get() {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    return new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      "postmessage"
    );
  },
});
