export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <div className="skeleton h-4 w-28 rounded" />
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="skeleton aspect-[3/4] w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-4/5 rounded" />
          <div className="skeleton h-6 w-24 rounded" />
          <div className="skeleton mt-4 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
