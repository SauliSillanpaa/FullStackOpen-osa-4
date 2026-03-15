const assert = require('node:assert')

const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('blogs contain id', async () => {
  const response = await api.get('/api/blogs')
  //console.log(response.body[0])
  assert.strictEqual(typeof response.body[0].id, 'string')
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('a valid blog can be added ', async () => {
  const newBlog =   {
    title: "My Blog",
    author: "Sauli Sillanpää",
    url: "https://blogi.fi/",
    likes: 123456789
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

  assert(titles.includes('My Blog'))
})

test('a blog without likes defaults to 0 when added to db', async () => {
  const newBlog =   {
    title: "My Blog",
    author: "Sauli Sillanpää",
    url: "https://blogi.fi/"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)

  const response = await api.get('/api/blogs')

  const blog = response.body[helper.initialBlogs.length]

  assert.strictEqual(blog.likes, 0)
})

test('adding a blog without a title responds 400', async () => {
  const newBlog =   {
    author: "Sauli Sillanpää",
    url: "https://blogi.fi/",
    likes: 123456789
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('adding a blog without a url responds 400', async () => {
  const newBlog =   {
    title: "My Blog",
    author: "Sauli Sillanpää",
    likes: 123456789
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

after(async () => {
  await mongoose.connection.close()
})