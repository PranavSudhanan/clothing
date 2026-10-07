export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-7 w-48 animate-pulse rounded-md bg-zinc-200" />
      <div className="a-card space-y-3 p-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-md bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
