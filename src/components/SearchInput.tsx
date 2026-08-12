"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Debounced search box.
 *
 * The committed value is the URL's ?search= — this component only owns the
 * keystrokes that have not been committed yet. 400ms after typing stops it
 * calls onChange, the URL updates, useFetch sees a new path and refetches. One
 * request per pause instead of one per character.
 *
 * `value` is also an INPUT, not just a seed: when "Clear filters" or the back
 * button changes the URL, the box has to follow.
 */

const DEBOUNCE_MS = 400;

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Announced to screen readers; the visible label is the magnifier icon. */
  label?: string;
}

/**
 * One state object rather than three, because the three move together and the
 * comparison below has to see a consistent set of them.
 */
interface Draft {
  /** What is in the box right now. */
  text: string;
  /** The last value this component pushed into the URL. */
  emitted: string;
  /** The last `value` prop it reacted to. */
  seen: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  label = "Search",
}: SearchInputProps) {
  const [draft, setDraft] = useState<Draft>({
    text: value,
    emitted: value,
    seen: value,
  });

  /**
   * Callers build onChange from router + searchParams, so its identity changes
   * on every navigation. Depending on it directly would restart the debounce
   * timer mid-type; the ref keeps the timer's dependencies to the text alone.
   */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  /**
   * Adjusting state during render — React's documented alternative to a resync
   * effect, and one render pass cheaper than one.
   *
   * `emitted` is what keeps it from eating keystrokes: the URL is also updated
   * BY this box, and that echo arrives a tick after the user may already have
   * typed more. Only a value this component did not send — a cleared filter,
   * the back button, a fresh load — overwrites what is in the box.
   */
  if (value !== draft.seen) {
    setDraft((current) => ({
      text: value === current.emitted ? current.text : value,
      emitted: current.emitted,
      seen: value,
    }));
  }

  const { text } = draft;
  const uncommitted = text !== value;

  useEffect(() => {
    if (!uncommitted) {
      return;
    }

    const timer = setTimeout(() => {
      setDraft((current) => ({ ...current, emitted: current.text }));
      onChangeRef.current(text);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, uncommitted]);

  /** Types a value and pushes it straight through, skipping the debounce. */
  function commit(next: string) {
    setDraft((current) => ({ ...current, text: next, emitted: next }));
    onChangeRef.current(next);
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        // type="text", not "search": WebKit's built-in clear affordance would
        // sit on top of the one below and neither is styleable.
        type="text"
        aria-label={label}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setDraft((current) => ({ ...current, text: next }));
        }}
        // Enter commits immediately rather than waiting out the debounce.
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(text);
          }
        }}
        className="h-9 pr-8 pl-8"
      />
      {text ? (
        <button
          type="button"
          aria-label="Clear search"
          // Clearing is an explicit action — do not make the user wait 400ms.
          onClick={() => commit("")}
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
