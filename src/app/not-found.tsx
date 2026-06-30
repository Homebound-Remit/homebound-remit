import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="text-8xl">🏠</div>
      <h1 className="text-4xl font-extrabold">404 — Page not found</h1>
      <p className="text-white/50 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist on Homebound.
      </p>
      <Link href="/">
        <Button size="lg">Go Home</Button>
      </Link>
    </div>
  );
}
