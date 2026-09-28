"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Match only the exact path (for section roots like /portal). */
  exact?: boolean;
}

interface AppShellProps {
  nav: NavItem[];
  /** Shown under the brand in the desktop sidebar (e.g. company name / "Admin"). */
  context: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}

export const BRAND_NAME = process.env.NEXT_PUBLIC_AGENCY_NAME || "Studio Portal";

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Mobile: content + fixed bottom tab bar (thumb reach).
 * Desktop (lg+): persistent left sidebar with the same items.
 */
export function AppShell({ nav, context, sidebarFooter, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 lg:flex">
        <div className="px-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-ink text-sm font-bold text-white">
              {BRAND_NAME.charAt(0)}
            </span>
            <span className="text-[15px] font-semibold tracking-tight">{BRAND_NAME}</span>
          </div>
          <div className="mt-3 truncate text-sm text-muted">{context}</div>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active ? "bg-ink text-white" : "text-muted hover:bg-subtle hover:text-ink",
                )}
              >
                <item.icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {sidebarFooter}
      </aside>

      <main className="pb-tabbar mx-auto w-full max-w-5xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pt-10">
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-ink" : "text-faint hover:text-muted",
                  )}
                >
                  <item.icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
