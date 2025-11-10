/**
 * @file googleConfig.test.js
 * @description Unit tests for Google OAuth2 config
 */
const dotenv = require("dotenv");
dotenv.config();

jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation((id, secret, redirect) => ({
        id,
        secret,
        redirect,
      })),
    },
  },
}));

describe("googleConfig Utility", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clear cache
    process.env = { ...OLD_ENV };
    process.env.GOOGLE_CLIENT_ID = "fake-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "fake-client-secret";
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should initialize OAuth2 client with env vars", () => {
    const { oauth2client } = require("../../../utils/googleConfig");
    const { google } = require("googleapis");

    // Verify constructor called with correct args
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      "fake-client-id",
      "fake-client-secret",
      "postmessage"
    );

    // Verify exported object shape
    expect(oauth2client).toEqual({
      id: "fake-client-id",
      secret: "fake-client-secret",
      redirect: "postmessage",
    });
  });

  it("should handle missing env vars gracefully", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    jest.resetModules();
    const { oauth2client } = require("../../../utils/googleConfig");

    // Should still construct an OAuth2 client (with undefined)
    expect(oauth2client).toEqual({
      id: undefined,
      secret: undefined,
      redirect: "postmessage",
    });
  });
});
