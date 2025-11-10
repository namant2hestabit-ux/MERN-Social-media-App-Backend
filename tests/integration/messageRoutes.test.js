const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('./setup');
jest.setTimeout(60000);
const User = require('../../models/userSchema');
const Message = require('../../models/messageSchema');
const { generateJWTToken } = require('../../config/jwtService');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Message Integration Tests', () => {
  it('should post and fetch messages for user', async () => {
    const u1 = await User.create({ firstName: 'One', lastName: 'Two', email: 'one@example.com', password: 'p1' });
    const u2 = await User.create({ firstName: 'Two', lastName: 'Three', email: 'two@example.com', password: 'p2' });

    const token = generateJWTToken({ id: u1._id });

    const resPost = await request(app)
      .post('/api/message')
      .set('Cookie', [`token=${token}`])
      .send({ receiver: u2._id, text: 'hello' });

  // Controller returns 200 with created message, accept 200 here
  expect(resPost.statusCode).toBe(200);

    const resGet = await request(app)
      .get(`/api/message/${u2._id}`)
      .set('Cookie', [`token=${token}`]);

  expect(resGet.statusCode).toBe(200);
  // Controller returns array directly
  expect(Array.isArray(resGet.body)).toBe(true);
  });
});
