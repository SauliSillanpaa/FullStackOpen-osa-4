const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there is initially some blogs saved', () => {
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

    describe('addition of a new blog', () => {
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
            const newBlog = {
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
            const newBlog = {
                title: "My Blog",
                author: "Sauli Sillanpää",
                likes: 123456789
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(400)
        })
    })

    describe('updation of a blog', () => {
        test('succeeds with updated likes', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]

            const updatedBlog = {
                title: blogToUpdate.title,
                author: blogToUpdate.author,
                url: blogToUpdate.url,
                likes: 77
            }

            await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send(updatedBlog)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd[0].likes, 77)
        })
        test('fails with statuscode 404 if blog does not exist', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]

            const updatedBlog = {
                title: blogToUpdate.title,
                author: blogToUpdate.author,
                url: blogToUpdate.url,
                likes: 77
            }
            const validNonexistingId = await helper.nonExistingId()

            await api
                .put(`/api/blogs/${validNonexistingId}`)
                .send(updatedBlog)
                .expect(404)
        })
        test('fails with statuscode 400 id is invalid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]

            const updatedBlog = {
                title: blogToUpdate.title,
                author: blogToUpdate.author,
                url: blogToUpdate.url,
                likes: 77
            }
            const invalidId = '5a3d5da59070081a82a3445'

            await api
                .put(`/api/blogs/${invalidId}`)
                .send(updatedBlog)
                .expect(400)
        })
    })

    describe('deletion of a blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]

            await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

            const blogsAtEnd = await helper.blogsInDb()

            const ids = blogsAtEnd.map(n => n.id)
            assert(!ids.includes(blogToDelete.id))

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
        })
    })
})

after(async () => {
  await mongoose.connection.close()
})