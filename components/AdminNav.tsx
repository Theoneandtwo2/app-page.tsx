import Image from "next/image";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

type AdminNavProps = {
  email: string;
  backToDashboard?: boolean;
};

export default function AdminNav({ email, backToDashboard }: AdminNavProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-gol-dark flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/gol-logo.png" alt="GOL" width={36} height={36} className="object-contain" />
          </div>
          <div className="min-w-0">
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green leading-none group-hover:text-gol-green-dark transition-colors">
              Gol Homes
            </div>
            <div className="text-[11px] text-gol-muted mt-1 truncate">
              Admin Dashboard
              <span className="hidden sm:inline">
                {" · "}
                <span className="text-gol-dark/70">{email}</span>
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {backToDashboard && (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex text-[13px] text-gol-green font-medium hover:text-gol-green-dark transition-colors"
            >
              ← Back
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
