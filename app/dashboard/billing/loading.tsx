export default function Loading() {
  return (
    <div className="flex flex-col gap-4 opacity-50">
      <div className="h-8 w-32 rounded-md bg-elevated animate-pulse" />
      <div className="h-32 rounded-xl bg-elevated animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
