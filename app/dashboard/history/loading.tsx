export default function Loading() {
  return (
    <div className="flex flex-col gap-4 opacity-50">
      <div className="h-8 w-40 rounded-md bg-elevated animate-pulse" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
