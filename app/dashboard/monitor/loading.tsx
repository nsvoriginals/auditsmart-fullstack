export default function MonitorLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-9 w-44 rounded-lg bg-elevated animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-elevated animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
