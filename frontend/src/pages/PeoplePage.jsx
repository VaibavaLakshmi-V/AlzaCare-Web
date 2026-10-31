import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, UserPlus, Users } from 'lucide-react'
import * as api from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import AddPersonForm from '../components/people/AddPersonForm'
import PersonCard from '../components/people/PersonCard'

export default function PeoplePage() {
  const [people, setPeople] = useState(null)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(async () => {
    try {
      setPeople(await api.getKnownPersons())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    await api.deletePerson(toDelete.id)
    setToDelete(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-semibold text-slate-800">People</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/25 hover:bg-teal-700"
          >
            <UserPlus className="h-4 w-4" /> Add person
          </button>
        )}
      </div>
      <p className="px-1 text-sm text-slate-500">
        Family and friends the patient should recognize. The patient station announces them by name.
      </p>

      {adding && (
        <AddPersonForm
          onCancel={() => setAdding(false)}
          onAdded={() => {
            setAdding(false)
            load()
          }}
        />
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      {people === null && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />}
      {people?.length === 0 && (
        <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center text-slate-400">
          <Users className="h-10 w-10" />
          <p className="text-sm">Nobody enrolled yet. Add the people the patient sees most often.</p>
        </div>
      )}
      {people?.length > 0 && (
        <ul className="space-y-3">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Delete ${toDelete.name}?`}
          message="Their photo and face data will be removed. The patient station will no longer recognize them."
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
