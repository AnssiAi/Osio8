import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ALL_AUTHORS, UPD_BORN } from '../queries'

const SetBirth = () => {
  const [name, setName] = useState('')
  const [strBorn, setBorn] = useState('')

  //Mutaatio
  const [updBirth] = useMutation(UPD_BORN, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const submit = async event => {
    event.preventDefault()

    const born = parseInt(strBorn)

    updBirth({ variables: { name, born } })

    setName('')
    setBorn('')
  }

  return (
    <div>
      <h3>Set birthyear</h3>
      <form onSubmit={submit}>
        <div>
          name
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div>
        <div>
          born
          <input
            value={strBorn}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>Update author</button>
      </form>
    </div>
  )
}

export default SetBirth
