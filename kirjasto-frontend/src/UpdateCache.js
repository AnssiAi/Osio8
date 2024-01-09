import { ALL_AUTHORS } from './queries'

export const updateCache = (cache, query, addedBook) => {
  // helper that is used to eliminate saving same person twice
  const uniqById = a => {
    let seen = new Set()
    return a.filter(item => {
      let k = item.id
      return seen.has(k) ? false : seen.add(k)
    })
  }

  cache.updateQuery(query, data => {
    const allBooks = data?.allBooks

    return {
      allBooks: uniqById(allBooks.concat(addedBook)),
    }
  })

  cache.updateQuery({ query: ALL_AUTHORS }, ({ allAuthors }) => {
    const author = addedBook.author
    //haetaan cachessa olevien kirjojen määrä
    const books = cache.readQuery(query)
    const num = books.allBooks.filter(b => b.author.id === author.id)

    return {
      allAuthors: allAuthors.map(a => {
        if (a.id === author.id) {
          a = {
            ...a,
            bookCount: num.length,
          }
        }
        return a
      }),
    }
  })
}
