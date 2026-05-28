import Image from "next/image";
import Link from "next/link";

type BrandHeaderProps = {
  subtitle?: React.ReactNode;
};

export default function BrandHeader({ subtitle }: BrandHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gol-dark flex items-center justify-center overflow-hidden flex-shrink-0">
        <Image
          src="/gol-logo.png"
          alt="GOL Homes"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      <div>
        <Link
          href="/"
          className="block text-2xs font-bold tracking-eyebrow uppercase text-gol-green hover:text-gol-green-dark transition-colors"
        >
          Gol Homes Development LLC
        </Link>
        <div className="text-[11px] text-gol-muted mt-0.5">
          {subtitle ?? "Subcontractor Portal"}
        </div>
      </div>
    </div>
  );
}
