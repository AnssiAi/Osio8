const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
const Author = require('./models/AuthorSchema')
const Book = require('./models/BookSchema')
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
        return Book.find({})
      }

      if (args.author && !args.genre) {
        const findAuthor = await Author.findOne({ name: args.author })
        return Book.find({ author: findAuthor })
      }

      if (args.genre && !args.author) {
        return Book.find({ genres: args.genre })
      }

      if (args.genre && args.author) {
        const findAuthor = await Author.findOne({ name: args.author })

        return Book.find({ author: findAuthor, genres: args.genre })
      }
    },
    allAuthors: async (root, args) => {
      return Author.find({})
    },
  },
  Author: {
    bookCount: async root => {
      return Book.countDocuments({ author: root })
    },
  },
  Mutation: {
    addBook: async (root, args) => {
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
        } else {
          const book = new Book({
            ...args,
            author: findAuthor,
          })

          await book.save()
          return book
        }
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
    editAuthor: async (root, args) => {
      try {
        const author = await Author.findOne({ name: args.name })
        author.born = args.setBornTo
        await author.save()
      } catch (error) {
        throw new GraphQLError('editing author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error,
          },
        })
      }
      return author
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
