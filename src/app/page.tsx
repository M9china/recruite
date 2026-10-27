/**
 * Holding page so the first deployment has something to serve.
 * Replaced by the full homepage in Milestone 2.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col justify-end bg-olive-900 px-4 pb-16 pt-24 text-white sm:px-10 md:pb-24">
      <div className="mx-auto w-full max-w-[1200px]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sand-400">
          Recruitment portal
        </p>
        <h1 className="max-w-3xl text-5xl uppercase leading-none md:text-7xl">
          Site in development
        </h1>
        <p className="mt-6 max-w-xl text-lg text-stone-100">
          The public recruitment website is being built. Careers, eligibility information and online
          applications will be available here once approved.
        </p>
      </div>
    </main>
  );
}
