const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
    let sum = 0
    blogs.forEach( blog => sum = sum + blog.likes)
    return sum
}

const favouriteBlog = (blogs) => {
    if(blogs.length === 0) {
        return 0
    }
    let favourite = blogs[0]
    
    blogs.forEach( blog => {
        if( blog.likes > favourite.likes) favourite = blog
    })
    return favourite
}

const mostBlogs = (blogs) => {

    const favourite = {
        author: "",
        blogs: 0
    }

    console.log(`Blogs' length is ${blogs.length}`)

    if(blogs.length !== 0) {

        const authors = new Map()

        const addAuthor = (author) => {
            console.log("adding authors")
            authors.set(author, 1)
        }

        const newBlog = (author) => {
            console.log("adding blogs")
            const current = authors.get(author)
            authors.set(author, current + 1)
        }

        blogs.forEach( blog => {
            const author = blog.author
            console.log(blog)
            console.log(author)
            authors.has(author) ? newBlog(author) : addAuthor(author)
        })

        console.log(authors)

        authors.forEach( (blogs, author) => {
            console.log(`\nCurren favourite is ${favourite.author} with ${favourite.blogs}`)
            console.log(`Challenged by ${author} with ${blogs}\n`)
            if(blogs > favourite.blogs) {
                console.log(`New favourite author is ${author}`)
                favourite.author = author
                favourite.blogs = blogs
            }
        })
    }

    return favourite
}

const mostLikes = (blogs) => {

    const favourite = {
        author: "",
        likes: 0
    }

    console.log(`Blogs' length is ${blogs.length}`)

    if(blogs.length !== 0) {

        const authors = new Map()

        const addAuthor = (author, likes) => {
            console.log("adding authors")
            authors.set(author, likes)
        }

        const newLikes = (author, likes) => {
            console.log("adding likes")
            const current = authors.get(author)
            authors.set(author, current + likes)
        }

        blogs.forEach( blog => {
            const author = blog.author
            const likes = blog.likes
            console.log(blog)
            console.log(author)
            console.log(likes)
            authors.has(author) ? newLikes(author, likes) : addAuthor(author, likes)
        })

        console.log(authors)

        authors.forEach( (likes, author) => {
            console.log(`\nCurren favourite is ${favourite.author} with ${favourite.likes}`)
            console.log(`Challenged by ${author} with ${likes}\n`)
            if(likes > favourite.likes) {
                console.log(`New favourite author is ${author}`)
                favourite.author = author
                favourite.likes = likes
            }
        })
    }

    return favourite
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs,
  mostLikes
}