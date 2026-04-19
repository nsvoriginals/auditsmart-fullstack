export default function DeepAuditLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-9 w-40 rounded-lg bg-elevated animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-elevated animate-pulse" />
      </div>
      <div className="h-32 rounded-xl bg-elevated animate-pulse" />
      <div className="h-80 rounded-xl bg-elevated animate-pulse" />
    </div>
  );
}
