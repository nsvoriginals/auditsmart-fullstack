export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-elevated animate-pulse" />
          <div className="h-4 w-40 rounded-lg bg-elevated animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-80 rounded-xl bg-elevated animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-44 rounded-xl bg-elevated animate-pulse" />
          <div className="h-32 rounded-xl bg-elevated animate-pulse" />
        </div>
      </div>
    </div>
  );
}
