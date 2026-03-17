"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/gift-coupons", label: "Gift 折價券" },
  { href: "/admin/assign", label: "指派折價券" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page — no nav
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      {/* Header */}
      <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
        Admin
      </h1>

      {/* Tab nav */}
      <nav className="flex gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent-bronze)] text-[var(--text-light)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
