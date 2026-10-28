export default function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product details"
      className="grid grid-cols-1 gap-10 animate-pulse lg:grid-cols-12 lg:gap-12"
    >
      <div className="lg:col-span-7">
        <div className="aspect-square w-full rounded-3xl bg-white/5" />
        <div className="mt-4 flex gap-3">
          <div className="h-20 w-20 rounded-xl bg-white/5 sm:h-24 sm:w-24" />
          <div className="h-20 w-20 rounded-xl bg-white/5 sm:h-24 sm:w-24" />
          <div className="h-20 w-20 rounded-xl bg-white/5 sm:h-24 sm:w-24" />
        </div>
      </div>
      <div className="space-y-6 lg:col-span-5">
        <div className="h-6 w-32 rounded-full bg-white/5" />
        <div className="h-10 w-3/4 rounded-xl bg-white/5" />
        <div className="h-8 w-44 rounded-xl bg-white/5" />
        <div className="h-24 w-full rounded-xl bg-white/5" />
        <div className="space-y-2">
          <div className="h-10 w-full rounded-xl bg-white/5" />
          <div className="h-10 w-full rounded-xl bg-white/5" />
        </div>
        <div className="h-12 w-full rounded-full bg-white/5" />
      </div>
    </div>
  );
}

