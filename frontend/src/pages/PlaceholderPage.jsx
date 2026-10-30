// Stand-in for screens built in part B
export default function PlaceholderPage({ icon: Icon, title, description, children }) {
  return (
    <div>
      <h1 className="mb-3 px-1 text-xl font-semibold text-slate-800">{title}</h1>
      <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Icon className="h-8 w-8" />
        </span>
        <p className="font-medium text-slate-700">{description}</p>
        <p className="text-sm text-slate-400">Coming in part B</p>
      </div>
      {children}
    </div>
  )
}
