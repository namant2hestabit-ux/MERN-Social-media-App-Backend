const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const User = require('../../models/userSchema');
const Post = require('../../models/postSchema');
const { generateJWTToken } = require('../../config/jwtService');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Post Integration Tests', () => {
  it('should create a post when authenticated', async () => {
    const user = await User.create({ firstName: 'Ab', lastName: 'B', email: 'a@b.com', password: 'hashed' });
    const token = generateJWTToken({ id: user._id });

    const res = await request(app)
      .post('/api/create-post')
      .set('Cookie', [`token=${token}`])
      .send({ title: 'Hello' });

    expect(res.statusCode).toBe(201);
    expect(res.body.post).toHaveProperty('_id');
    expect(res.body.post.title).toBe('Hello');
  });

  it('should fail creating post when not authenticated', async () => {
    const res = await request(app).post('/api/create-post').send({ title: 'Hello' });
    expect(res.statusCode).toBe(401);
  });
});
