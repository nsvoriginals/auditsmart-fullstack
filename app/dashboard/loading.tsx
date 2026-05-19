export default function Loading() {
  return (
    <div className="flex flex-col gap-4 opacity-50">
      <div className="h-8 w-48 rounded-md bg-elevated animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-xl bg-elevated animate-pulse" />
        <div className="h-72 rounded-xl bg-elevated animate-pulse" />
      </div>
    </div>
  );
}
