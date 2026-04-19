export default function BillingLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-9 w-36 rounded-lg bg-elevated animate-pulse" />
        <div className="h-4 w-56 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="h-40 rounded-xl bg-elevated animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
