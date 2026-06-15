export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-wrap" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <span className="skeleton-line" key={index} />
      ))}
    </div>
  );
}
