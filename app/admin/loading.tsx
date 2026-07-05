export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#eadfce] bg-white/90 p-8 shadow-[0_16px_50px_rgba(128,92,46,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b77624]">
          PawJai Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#4f4338]">
          Loading workspace...
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#7a6d61]">
          Preparing the admin tools for this route.
        </p>
      </div>
    </main>
  );
}
