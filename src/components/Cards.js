import { youtubeThumbnail } from "@/lib/data";

export function StatCard({ label, value }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong></article>;
}

export function AnnouncementCard({ item, compact = false }) {
  return (
    <article className="announcement-card panel">
      <img src={item.imageHorizontal || item.image} alt="" />
      <span className="label">{item.visibility}</span>
      <h2 className="headline">{item.title}</h2>
      {!compact ? <p className="muted">{item.description}</p> : null}
      <p className="meta">{item.publishTime}</p>
    </article>
  );
}

export function KnowledgeCard({ item }) {
  return (
    <article className="learning-card panel stack-sm">
      <a className="youtube-thumb" href={item.youtubeUrl} target="_blank" rel="noreferrer">
        <img src={youtubeThumbnail(item.youtubeId)} alt="" /><span>Watch</span>
      </a>
      <div className="actions">{item.categories.map((category) => <span className="badge" key={category}>{category}</span>)}</div>
      <h2 className="headline">{item.title}</h2>
      <p className="muted">{item.description}</p>
      <p className="meta">{item.views.toLocaleString()} system views</p>
    </article>
  );
}
