export default function Loading() {
  return (
    <div className="flex flex-col gap-6 opacity-50">
      <div className="h-9 w-52 rounded-md bg-elevated animate-pulse" />
      <div className="h-32 rounded-2xl bg-elevated animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-elevated animate-pulse" />
    </div>
  );
}
