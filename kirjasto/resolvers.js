const { PubSub } = require('graphql-subscriptions')
const jwt = require('jsonwebtoken')

const Author = require('./models/AuthorSchema')
const Book = require('./models/BookSchema')
const User = require('./models/UserSchema')
const { GraphQLError } = require('graphql')

const pubsub = new PubSub()

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

        let author = {}

        if (!findAuthor) {
          const newAuthor = new Author({ name: args.author })
          await newAuthor.save()

          author = newAuthor
        } else {
          author = findAuthor
        }

        const book = new Book({
          ...args,
          author: author,
        })

        await book.save()

        pubsub.publish('BOOK_ADDED', { bookAdded: book })

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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
}

module.exports = resolvers
