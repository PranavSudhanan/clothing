import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center" style={{ fontFamily: "var(--f-body)" }}>
      <p className="text-xs uppercase tracking-[0.3em] opacity-60">Error 404</p>
      <h1 className="text-5xl md:text-7xl" style={{ fontFamily: "var(--f-heading)" }}>
        Page not found
      </h1>
      <p className="max-w-md opacity-70">The page you are looking for has moved, or never existed.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link href="/shop" className="btn btn-outline">
          Shop the collection
        </Link>
      </div>
    </div>
  );
}
