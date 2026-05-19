export default function Loading() {
  return (
    <div className="flex flex-col gap-4 opacity-50">
      <div className="h-8 w-40 rounded-md bg-elevated animate-pulse" />
      <div className="h-72 rounded-xl bg-elevated animate-pulse" />
    </div>
  );
}
