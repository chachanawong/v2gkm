import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <>
      <div className="metric-grid" aria-label="Loading dashboard metrics">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="metric-card" key={index}>
            <div className="skeleton-wrap" aria-hidden="true">
              <span className="skeleton-line" style={{ height: 12, width: "42%" }} />
              <span className="skeleton-line" style={{ height: 30, width: "28%" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" aria-label="Loading dashboard panels">
        <section className="panel wide">
          <div className="panel-head">
            <div className="skeleton-wrap" aria-hidden="true" style={{ width: "100%", maxWidth: 360 }}>
              <span className="skeleton-line" style={{ height: 12, width: "34%" }} />
              <span className="skeleton-line" style={{ height: 22, width: "52%" }} />
            </div>
          </div>
          <Skeleton rows={2} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="skeleton-wrap" aria-hidden="true" style={{ width: "100%", maxWidth: 280 }}>
              <span className="skeleton-line" style={{ height: 12, width: "30%" }} />
              <span className="skeleton-line" style={{ height: 22, width: "62%" }} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 24 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="bar-row" key={index}>
                <span className="skeleton-line" style={{ height: 18, width: "100%" }} />
                <div>
                  <i style={{ width: `${84 - index * 16}%`, background: "linear-gradient(90deg, var(--surface-container) 25%, var(--surface) 40%, var(--surface-container) 70%)", backgroundSize: "240% 100%", animation: "shimmer 1.2s linear infinite" }} />
                </div>
                <strong className="skeleton-line" style={{ height: 18, width: "100%" }} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="skeleton-wrap" aria-hidden="true" style={{ width: "100%", maxWidth: 280 }}>
              <span className="skeleton-line" style={{ height: 12, width: "28%" }} />
              <span className="skeleton-line" style={{ height: 22, width: "56%" }} />
            </div>
          </div>
          <div style={{ display: "grid" }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="mini-row mini-row-panel" key={index}>
                <span className="skeleton-line" style={{ height: 18, width: `${58 - index * 6}%` }} />
                <span className="skeleton-line" style={{ height: 34, width: 112, borderRadius: 10, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-head">
            <div className="skeleton-wrap" aria-hidden="true" style={{ width: "100%", maxWidth: 300 }}>
              <span className="skeleton-line" style={{ height: 12, width: "34%" }} />
              <span className="skeleton-line" style={{ height: 22, width: "50%" }} />
            </div>
          </div>
          <div style={{ display: "grid" }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="mini-row mini-row-panel mini-row-knowledge" key={index}>
                <span className="skeleton-line" style={{ height: 18, width: `${78 - index * 5}%` }} />
                <span className="skeleton-line" style={{ height: 34, width: 110, borderRadius: 10, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-head">
            <div className="skeleton-wrap" aria-hidden="true" style={{ width: "100%", maxWidth: 320 }}>
              <span className="skeleton-line" style={{ height: 12, width: "24%" }} />
              <span className="skeleton-line" style={{ height: 22, width: "64%" }} />
            </div>
            <span className="skeleton-line" style={{ height: 30, width: 86, borderRadius: 999 }} />
          </div>
          <div className="activity-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="activity-item" key={index}>
                <i style={{ borderColor: "transparent", background: "var(--surface-container)" }} />
                <div>
                  <span className="skeleton-line" style={{ height: 16, width: `${72 - index * 4}%` }} />
                  <span className="skeleton-line" style={{ height: 14, width: `${46 - index * 3}%` }} />
                  <span className="skeleton-line" style={{ height: 12, width: "24%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
