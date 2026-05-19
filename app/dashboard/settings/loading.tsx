export default function Loading() {
  return (
    <div className="flex flex-col gap-3 opacity-50">
      <div className="h-8 w-32 rounded-md bg-elevated animate-pulse" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-elevated animate-pulse" />
      ))}
    </div>
  );
}
