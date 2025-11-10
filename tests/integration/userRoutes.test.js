const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../../models/userSchema");

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("User Integration Tests", () => {
  it("should sign up a user", async () => {
    const res = await request(app)
      .post("/api/signup")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "123456",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user.email).toBe("john@example.com");
  });

  it("should log in a user and set cookies", async () => {
    // Create a user manually with a real bcrypt hash
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('123456', 8);
    await User.create({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: hashed,
    });

    const res = await request(app)
      .post("/api/login")
      .send({
        email: "jane@example.com",
        password: "123456",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/logged in/i);
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});
