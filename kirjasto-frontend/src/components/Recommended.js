import { useQuery } from '@apollo/client'
import { GET_USER, ALL_BOOKS } from '../queries'

//Ottaa käyttäjän
//Ottaa AllBooks
//Tekee parametrisoidun AllBooks kyselyn käyttäjän genrellä
//Palauttaa taulukon

const Recommended = props => {
  const user = useQuery(GET_USER, {
    fetchPolicy: 'cache-and-network',
  })

  //Custom kysely toimisi vähemmällä verkkoliikenteellä
  //Kyselyn tekeminen skipataan kunnes user.data on saatavilla
  const books = useQuery(ALL_BOOKS, {
    variables: { genre: user.data?.me?.favoriteGenre },
    skip: user.loading || !user.data?.me?.favoriteGenre,
  })

  const loading = user.loading || books.loading
  const error = user.error || books.error

  if (!props.show) {
    return null
  }
  if (loading) {
    return <div>loading...</div>
  }
  if (error) {
    return <div>Error {error.message}</div>
  }

  const bookList = books.data.allBooks

  return (
    <div>
      <h2>Recommended books for {user.data.me.username}</h2>
      <p>Books in your favorite genre: {user.data.me.favoriteGenre}</p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {bookList.map(a => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommended
