export default function Loading() {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto opacity-50">
      <div className="h-8 w-56 rounded-md bg-elevated animate-pulse" />
      <div className="h-40 rounded-xl bg-elevated animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-elevated animate-pulse" />
    </div>
  );
}
