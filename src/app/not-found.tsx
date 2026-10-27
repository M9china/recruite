import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col justify-center px-4 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">Error 404</p>
      <h1 className="mt-3 text-5xl uppercase">Page not found</h1>
      <p className="mt-4 max-w-lg text-stone-500">The page you are looking for does not exist or has moved.</p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-[2px] bg-forest-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-forest-600"
      >
        Back to home
      </Link>
    </main>
  );
}
