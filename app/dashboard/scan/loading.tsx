export default function ScanLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-9 w-48 rounded-lg bg-elevated animate-pulse" />
      <div className="h-4 w-72 rounded-lg bg-elevated animate-pulse" />
      <div className="h-96 rounded-xl bg-elevated animate-pulse" />
    </div>
  );
}
