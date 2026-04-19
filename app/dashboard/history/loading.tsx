export default function HistoryLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-9 w-44 rounded-lg bg-elevated animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-elevated animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
