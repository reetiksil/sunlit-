import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Access restricted" };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-5">
      <ShieldAlert className="mx-auto h-10 w-10 text-primary" aria-hidden />
      <h1 className="font-serif text-3xl font-semibold">This room is for curators</h1>
      <p className="text-sm text-text-muted">
        Your account doesn&apos;t have permission to view this page. If you think that&apos;s a mistake, ask an
        administrator to grant access.
      </p>
      <Link href="/" className="btn btn-primary">Back to the reading room</Link>
    </div>
  );
}
