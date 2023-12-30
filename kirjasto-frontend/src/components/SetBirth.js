import { useState } from 'react'
import { useMutation } from '@apollo/client'
import Select from 'react-select'
import { ALL_AUTHORS, UPD_BORN } from '../queries'

const SetBirth = ({ authors }) => {
  const [item, setItem] = useState(null)
  const [strBorn, setBorn] = useState('')

  //Mutaatio
  const [updBirth] = useMutation(UPD_BORN, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const submit = async event => {
    event.preventDefault()

    const name = item.value
    //type='number' ei tee luotettavasti parsimista
    const born = parseInt(strBorn)

    updBirth({ variables: { name, born } })

    setBorn('')
  }

  //Muutetaan authors react-select ymmärtämään muotoon
  const options = authors.map(a => {
    return { value: a.name, label: a.name }
  })

  return (
    <div>
      <h3>Set birthyear</h3>
      <form onSubmit={submit}>
        <Select value={item} onChange={setItem} options={options} />
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
