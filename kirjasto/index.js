const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
const Author = require('./models/AuthorSchema')
const Book = require('./models/BookSchema')
const User = require('./models/UserSchema')
const { GraphQLError } = require('graphql')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB', error.message)
  })

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: async (root, args) => {
      return Book.countDocuments()
    },
    authorCount: async (root, args) => {
      return Author.countDocuments()
    },
    allBooks: async (root, args) => {
      //Ei ole kaunis mutta toimii
      if (!args.genre && !args.author) {
        //Populate täyttää author kentän objektin tiedoilla
        return Book.find({}).populate('author')
      }

      if (args.author && !args.genre) {
        const findAuthor = await Author.findOne({ name: args.author })
        return Book.find({ author: findAuthor }).populate('author')
      }

      if (args.genre && !args.author) {
        return Book.find({ genres: args.genre }).populate('author')
      }

      if (args.genre && args.author) {
        const findAuthor = await Author.findOne({ name: args.author })

        return Book.find({ author: findAuthor, genres: args.genre }).populate(
          'author'
        )
      }
    },
    allAuthors: async (root, args) => {
      return Author.find({})
    },
    me: async (root, args, context) => {
      return context.currentUser
    },
  },
  Author: {
    bookCount: async root => {
      return Book.countDocuments({ author: root })
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      try {
        const findAuthor = await Author.findOne({ name: args.author })

        if (!findAuthor) {
          const author = new Author({ name: args.author })
          await author.save()

          const book = new Book({
            ...args,
            author: author,
          })

          await book.save()
          return book
        }

        const book = new Book({
          ...args,
          author: findAuthor,
        })

        await book.save()
        return book
      } catch (error) {
        throw new GraphQLError('Adding book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      try {
        const author = await Author.findOne({ name: args.name })
        author.born = args.setBornTo

        await author.save()
        return author
      } catch (error) {
        throw new GraphQLError('editing author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      }
    },
    createUser: async (root, args) => {
      const user = new User({ ...args })

      return user.save().catch(error => {
        throw new GraphQLError('Creating user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'salasana') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
