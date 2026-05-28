import React from "react";

export default function DetailRow({
  label,
  value,
  isLast = false,
  valueClassName = "",
}: {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2.5 ${
        isLast ? "" : "border-b border-gray-50"
      }`}
    >
      <span className="text-xs text-gol-muted font-medium">{label}</span>
      <span className={`text-sm text-gol-dark font-medium text-right max-w-[60%] ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}
