import { Loader2, Trash2, UserRound } from 'lucide-react'
import { personPhotoPath } from '../../api'
import { useAuthedImage } from '../../hooks/useAuthedImage'

// Enrolled person with their photo (loaded with the token as a blob)
export default function PersonCard({ person, onDelete }) {
  const { url, loading } = useAuthedImage(personPhotoPath(person.id))

  return (
    <li className="card flex items-center gap-3 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
        {url ? (
          <img src={url} alt={person.name} className="h-full w-full object-cover" />
        ) : loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <UserRound className="h-7 w-7 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{person.name}</p>
        <p className="truncate text-sm text-slate-500">{person.relationship}</p>
      </div>
      <button
        onClick={() => onDelete(person)}
        aria-label={`Delete ${person.name}`}
        className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </li>
  )
}
