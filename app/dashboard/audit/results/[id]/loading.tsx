export default function AuditResultsLoading() {
  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="h-9 w-28 rounded-lg bg-elevated animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg bg-elevated animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-elevated animate-pulse" />
        </div>
      </div>
      <div className="h-12 w-72 mx-auto rounded-lg bg-elevated animate-pulse" />
      <div className="h-48 rounded-xl bg-elevated animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-elevated animate-pulse" />
      <div className="h-64 rounded-xl bg-elevated animate-pulse" />
    </div>
  );
}
