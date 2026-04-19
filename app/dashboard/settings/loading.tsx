export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-9 w-32 rounded-lg bg-elevated animate-pulse" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-elevated animate-pulse" />
        ))}
      </div>
    </div>
  );
}
