import React from "react";

export type StatusKey =
  | "pending_review"
  | "incomplete"
  | "approved"
  | "rejected"
  | "paid"
  | "missing_info";

type Style = {
  label: string;
  classes: string;
  icon: string;
  heroBg: string;
};

const STYLES: Record<StatusKey, Style> = {
  pending_review: {
    label: "Pending Review",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⏳",
    heroBg: "bg-gol-soft",
  },
  approved: {
    label: "Approved",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "✅",
    heroBg: "bg-emerald-50/70",
  },
  paid: {
    label: "Paid",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "💳",
    heroBg: "bg-blue-50/70",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-red-50 text-red-800 border-red-200",
    icon: "✗",
    heroBg: "bg-red-50/70",
  },
  incomplete: {
    label: "Incomplete",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
    icon: "⚠️",
    heroBg: "bg-orange-50/70",
  },
  missing_info: {
    label: "Missing Info",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
    icon: "⚠️",
    heroBg: "bg-orange-50/70",
  },
};

export function getStatusStyle(status: string): Style {
  return STYLES[status as StatusKey] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "•",
    heroBg: "bg-gray-50",
  };
}

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md" | "lg";
}) {
  const style = getStatusStyle(status);
  const sizeClasses =
    size === "lg"
      ? "px-3.5 py-1.5 text-sm"
      : size === "sm"
      ? "px-2.5 py-0.5 text-[11px]"
      : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${style.classes} ${sizeClasses}`}
    >
      {style.label}
    </span>
  );
}

export function StatusHero({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 mb-5 ${style.heroBg}`}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {style.icon}
      </span>
      <div>
        <p className="text-2xs font-semibold tracking-eyebrow uppercase text-gol-muted mb-1">
          Current Status
        </p>
        <StatusBadge status={status} size="lg" />
      </div>
    </div>
  );
}
