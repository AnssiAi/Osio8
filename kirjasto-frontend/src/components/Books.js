import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
import { useState } from 'react'

const Books = props => {
  //Etsityn genren muuttujatiedon säilyttämiseksi
  //const [bookGenre, setGenre] = useState('')

  //Parametrisoitu kyselymuoto - muutettu refetch muotoon
  const { data, loading, error, refetch } = useQuery(ALL_BOOKS)

  if (!props.show) {
    return null
  }
  if (loading) {
    return <div>loading...</div>
  }
  if (error) {
    return <div>Error {error.message}</div>
  }

  const bookList = data.allBooks

  //Kerätään kirjojen genret listaan nappien generoimiseksi olemassaolevien genrejen pohjalta
  //Tämän listan olisi hyvä olla muuttumaton
  const genres = bookList.reduce((array, item) => {
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
    refetch({
      genre: event.target.value,
    })
    //setGenre(event.target.value)
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
          {bookList.map(a => (
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
      <button value={''} onClick={assignGenre}>
        show all
      </button>
    </div>
  )
}

export default Books
