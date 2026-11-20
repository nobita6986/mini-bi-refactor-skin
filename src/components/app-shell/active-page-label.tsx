"use client";

/**
 * ActivePageLabel — Client Component.
 * - Dung usePathname() + findEntryByPath de in nhan sr-only "Đang ở trang: X" cho screen-reader.
 * - Dieu phoi hieu ung chuyen trang hien dai (Modern Page Transition Orchestrator):
 *   1. Thanh tien trinh (Top Progress Bar) + hieu ung lui nhe trang cu ngay khi bam link dieu huong.
 *   2. Hieu ung luot vao (Editorial Glide + Staggered Section Reveal) tren <main> khi route moi mount.
 *   3. Dieu huong focus a11y ve tieu de h1 neu focus cu bi mat sau khi chuyen trang.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { findEntryByPath } from "@/lib/navigation/registry";

export function ActivePageLabel() {
  const pathname = usePathname();
  const active = findEntryByPath(pathname);
  const [progressState, setProgressState] = useState<"idle" | "loading" | "completing">("idle");
  const prevPathRef = useRef<string>(pathname);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      document.documentElement.setAttribute("data-route-state", "loading");
      setProgressState("loading");
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    const pathChanged = prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    document.documentElement.removeAttribute("data-route-state");

    const mainEl = document.querySelector("main");
    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (mainEl instanceof HTMLElement && !reducedMotion) {
      mainEl.setAttribute("data-page-enter", "true");
      try {
        mainEl.animate(
          [
            { opacity: 0, transform: "translate3d(0, 12px, 0) scale(0.996)" },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          {
            duration: 280,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
          },
        );

        const sections = mainEl.querySelectorAll<HTMLElement>(
          ":scope > header, :scope > section, :scope > div > header, :scope > div > section, :scope > div > div > header, :scope > div > div > section",
        );
        sections.forEach((sec, index) => {
          if (index > 6 || sec.closest(".rdg")) return;
          sec.animate(
            [
              { opacity: 0, transform: "translate3d(0, 10px, 0)" },
              { opacity: 1, transform: "translate3d(0, 0, 0)" },
            ],
            {
              duration: 260,
              delay: Math.min(index * 38, 160),
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "both",
            },
          );
        });
      } catch {
        // Ignore WAAPI errors in older or headless environments
      }
    }

    if (pathChanged && mainEl instanceof HTMLElement) {
      // Accessibility focus routing when previous focused element was unmounted
      if (!document.activeElement || document.activeElement === document.body) {
        const heading = mainEl.querySelector<HTMLElement>("h1");
        if (heading) {
          if (!heading.hasAttribute("tabindex")) {
            heading.setAttribute("tabindex", "-1");
          }
          heading.focus({ preventScroll: true });
        }
      }
    }

    if (!pathChanged) return;

    const completeTimer = window.setTimeout(() => {
      setProgressState("completing");
    }, 0);
    const idleTimer = window.setTimeout(() => {
      setProgressState("idle");
    }, 260);

    return () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(idleTimer);
    };
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden="true"
        data-route-progress={progressState}
        className="bi-route-progress"
      />
      {active ? <p className="sr-only">Đang ở trang: {active.label}</p> : null}
    </>
  );
}
