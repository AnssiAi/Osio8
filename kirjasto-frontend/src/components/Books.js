import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
import { useState } from 'react'

const Books = props => {
  //Etsityn genren muuttujatiedon säilyttämiseksi
  const [genre, setGenre] = useState('')

  //Parametrisoitu kyselymuoto
  const { loading, error, data } = useQuery(ALL_BOOKS, {
    variables: { genre },
  })

  if (!props.show) {
    return null
  }
  if (loading) {
    return <div>loading...</div>
  }
  if (error) {
    return <div>Error {error.message}</div>
  }

  const books = data.allBooks

  //Kerätään kirjojen genret listaan nappien generoimiseksi olemassaolevien genrejen pohjalta
  //Tämän listan olisi hyvä olla muuttumaton
  const genres = books.reduce((array, item) => {
    const itGenres = [...item.genres]

    itGenres.forEach(i => {
      const check = array.includes(i)
      if (!check) {
        array.push(i)
      }
    })

    return array
  }, [])

  const assignGenre = event => {
    event.preventDefault()
    setGenre(event.target.value)
  }

  const clearGenre = event => {
    event.preventDefault()
    setGenre('')
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map(a => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres.map(g => (
        <button key={g} value={g} onClick={assignGenre}>
          {g}
        </button>
      ))}
      <button onClick={clearGenre}>show all</button>
    </div>
  )
}

export default Books
