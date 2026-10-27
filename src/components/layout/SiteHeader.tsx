"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";

type NavItem = { href: string; label: string };

/**
 * Sticky header. On the homepage it starts transparent over the hero photo and
 * turns solid once the page scrolls. Below lg it collapses into a full-screen
 * menu with focus trapping, Escape to close and body scroll lock.
 */
export function SiteHeader({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const list = [toggleRef.current, ...focusables()].filter((el): el is HTMLElement => !!el);
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const transparent = isHome && !scrolled && !open;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-40 text-white transition-colors duration-200 ${
        transparent ? "bg-transparent" : "bg-olive-900 shadow-[0_1px_0_rgba(255,255,255,0.08)]"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-charcoal-900"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-8">
        <Wordmark />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="relative py-2 text-[0.95rem] font-medium text-white/90 hover:text-white aria-[current=page]:text-white aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-sand-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Wrapper controls visibility: `hidden` on the link itself would clash with the button's inline-flex. */}
          <span className="hidden sm:block">
            <Link href="/apply" className={buttonClasses("accent", "min-h-10 px-5")}>
              Apply now
            </Link>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="relative block h-4 w-6">
              <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform duration-200 ${open ? "top-[7px] rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-[7px] block h-0.5 w-6 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-transform duration-200 ${open ? "top-[7px] -rotate-45" : "top-[14px]"}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="absolute inset-x-0 top-full h-[calc(100dvh-72px)] overflow-y-auto bg-olive-900 lg:hidden"
        >
          <nav aria-label="Main" className="px-4 pb-10 pt-4 sm:px-8">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="block py-4 font-display text-3xl font-semibold aria-[current=page]:text-sand-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/apply" className={buttonClasses("accent", "mt-8 w-full")}>
              Apply now
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
