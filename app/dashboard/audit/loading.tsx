export default function AuditLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-9 w-56 rounded-lg bg-elevated animate-pulse" />
        <div className="h-4 w-80 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="h-[480px] rounded-xl bg-elevated animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-elevated animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
