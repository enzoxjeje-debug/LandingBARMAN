"use client";

import { useEffect, useRef } from "react";

/**
 * Fades an element in the first time it scrolls into view.
 *
 * The element is born with `data-reveal="out"` in the markup, so it is already
 * hidden on the first paint — nothing flashes when the menu re-renders. This
 * hook only ever flips that to `"in"`; the CSS animation does the work and
 * expires on its own, which leaves each component's own transitions (the card
 * hover lift, for instance) untouched.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delay = 0) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || element.dataset.reveal !== "out") return;
    if (delay) element.style.setProperty("--reveal-delay", `${delay}ms`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.reveal = "in";
        observer.disconnect();
      },
      // Trigger a little above the bottom edge so the fade reads as the element
      // arriving rather than snapping in once it is already fully visible.
      { root: scrollParent(element), rootMargin: "0px 0px -48px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}

/** Nearest scrollable ancestor, so reveals fire against the page's scroll box. */
function scrollParent(element: HTMLElement) {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY) && parent !== document.body && parent !== document.documentElement) {
      return parent;
    }
  }
  return null;
}
