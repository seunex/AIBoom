export function OriginalLink({
  href,
  sourceName,
  prominent = false,
}: {
  href: string;
  sourceName: string;
  prominent?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        prominent
          ? "inline-flex items-center bg-ink px-5 py-3 text-base text-paper transition-colors hover:bg-accent"
          : "inline-flex items-center bg-ink px-4 py-2.5 text-sm text-paper transition-colors hover:bg-accent"
      }
    >
      Read at {sourceName}
      <span className="sr-only">
        {" "}
        (opens the original article in a new tab)
      </span>
    </a>
  );
}
