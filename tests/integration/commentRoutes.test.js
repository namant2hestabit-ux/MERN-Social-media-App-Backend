const request = require('supertest');
// Increase timeout for integration tests (in-memory replica set startup/teardown)
jest.setTimeout(60000);
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const User = require('../../models/userSchema');
const Post = require('../../models/postSchema');
const Comment = require('../../models/commentSchema');
const { generateJWTToken } = require('../../config/jwtService');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Comment Integration Tests', () => {
  it('should create a comment when authenticated and post exists', async () => {
    const user = await User.create({ firstName: 'Sam', lastName: 'X', email: 'sam@example.com', password: 'h' });
    const post = await Post.create({ title: 'test post', author: user._id });
    const token = generateJWTToken({ id: user._id });

    const res = await request(app)
      .post(`/api/comment/${post._id}`)
      .set('Cookie', [`token=${token}`])
      .send({ comment: 'Nice post' });

      console.log(res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment._id).toBeDefined();
  });

  it('should return 404 when commenting on non-existent post', async () => {
    const user = await User.create({ firstName: 'Sam', lastName: 'X', email: 'sam2@example.com', password: 'h' });
    const token = generateJWTToken({ id: user._id });

    const res = await request(app)
      .post(`/api/comment/000000000000000000000000`)
      .set('Cookie', [`token=${token}`])
      .send({ comment: 'Hello' });

    expect(res.statusCode).toBe(404);
  });
});
