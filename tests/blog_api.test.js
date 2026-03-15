const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)


//
//
//          TESTING BLOGS
//
//

describe('when there is initially some blogs saved', () => {
    beforeEach(async () => {
        await Blog.deleteMany({})
        await Blog.insertMany(helper.initialBlogs)
        
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })
        await user.save()
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
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                
            const newBlog =   {
                title: "My Blog",
                author: "Sauli Sillanpää",
                url: "https://blogi.fi/",
                likes: 123456789
            }

            await api
                .post('/api/blogs')
                .set({ Authorization: `Bearer ${login.body.token}` })
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)
            
            const response = await api.get('/api/blogs')

            const titles = response.body.map(r => r.title)

            assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

            assert(titles.includes('My Blog'))
        })

        test('adding a blog without a token returns 401 ', async () => {                
            const newBlog =   {
                title: "My Blog",
                author: "Sauli Sillanpää",
                url: "https://blogi.fi/",
                likes: 123456789
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(401)
        })

        test('a blog without likes defaults to 0 when added to db', async () => {
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })

            const newBlog =   {
                title: "My Blog",
                author: "Sauli Sillanpää",
                url: "https://blogi.fi/"
            }

            await api
                .post('/api/blogs')
                .set({ Authorization: `Bearer ${login.body.token}` })
                .send(newBlog)

            const response = await api.get('/api/blogs')

            const blog = response.body[helper.initialBlogs.length]

            assert.strictEqual(blog.likes, 0)
        })

        test('adding a blog without a title responds 400', async () => {
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })

            const newBlog = {
                author: "Sauli Sillanpää",
                url: "https://blogi.fi/",
                likes: 123456789
            }

            await api
                .post('/api/blogs')
                .set({ Authorization: `Bearer ${login.body.token}` })
                .send(newBlog)
                .expect(400)
        })

        test('adding a blog without a url responds 400', async () => {
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })

            const newBlog = {
                title: "My Blog",
                author: "Sauli Sillanpää",
                likes: 123456789
            }

            await api
                .post('/api/blogs')
                .set({ Authorization: `Bearer ${login.body.token}` })
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
        let blogID = 0
        beforeEach( async () => {
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
                
            const newBlog =   {
                title: "My Blog",
                author: "Sauli Sillanpää",
                url: "https://blogi.fi/",
                likes: 123456789
            }

            const addedBlog = await api
                .post('/api/blogs')
                .set({ Authorization: `Bearer ${login.body.token}` })
                .send(newBlog)
            //await console.log(`blog body:`)
            //await console.log(addedBlog.body)
            blogID = addedBlog.body.id
        })
        test('succeeds with status code 204 if id is valid', async () => {
            const login = await api
                .post('/api/login')
                .send({ username: 'root', password: 'sekret' })
            //await console.log(`login body:`)
            //await console.log(login.body)

            //const blogsAtStart = await helper.blogsInDb()
            //await console.log(`blog id: ${blogID}`)
            const blogToDelete = await Blog.findById(blogID)
            //await console.log(`blog to delete: ${blogToDelete}`)

            await api
                .delete(`/api/blogs/${blogID}`)
                .set({ Authorization: `Bearer ${login.body.token}` })
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()

            const ids = blogsAtEnd.map(n => n.id)
            assert(!ids.includes(blogToDelete.id))

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        })
    })
})

//
//
//          TESTING USERS
//
//

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  
  test('users are returned as json', async () => {
    await api
        .get('/api/users')
        .expect(200)
        .expect('Content-Type', /application\/json/)
  })

  test('users contain id', async () => {
    const response = await api.get('/api/users')
    assert.strictEqual(typeof response.body[0].id, 'string')
    })

  test('all users are returned', async () => {
    const response = await api.get('/api/users')

    assert.strictEqual(response.body.length, 1)
  })

  describe('creating users', () => {
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        assert(usernames.includes(newUser.username))
    })
    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('expected `username` to be unique'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
    test('creation fails with proper statuscode and message if username is missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('User validation failed'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
    test('creation fails with proper statuscode and message if username is too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'ro',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('User validation failed'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
test('creation fails with proper statuscode and message if password is missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('Invalid password'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
    test('creation fails with proper statuscode and message if password is too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'sa',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('Invalid password'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })
})

//
//
//          TESTING LOGIN
//
//


after(async () => {
  await mongoose.connection.close()
})