"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight, Home } from "lucide-react";
import { BREADCRUMB_MAP } from "@/config/breadcrumbs";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({
  customItems,
  className = "",
}: {
  customItems?: BreadcrumbItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (customItems && customItems.length > 0) return customItems;

    const segments = pathname.split("/").filter(Boolean);
    let accumPath = "";

    return segments.map((seg, idx) => {
      accumPath += `/${seg}`;
      const config = BREADCRUMB_MAP[seg];
      const isLast = idx === segments.length - 1;

      return {
        label:
          config?.label ||
          seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        href: isLast ? undefined : config?.href || accumPath,
      };
    });
  }, [pathname, customItems]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`mb-3 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted font-medium">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Beranda</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted/50 shrink-0" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-ink hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink font-semibold" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
