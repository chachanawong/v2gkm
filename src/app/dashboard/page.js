import { AnnouncementCard, KnowledgeCard, StatCard } from "@/components/Cards";
import { Header } from "@/components/Header";
import { announcements, getPublished, learning, member, profiles } from "@/lib/data";

export default function DashboardPage() {
  const publishedAnnouncements = getPublished(announcements);
  const publishedLearning = getPublished(learning);
  const publishedProfiles = getPublished(profiles);
  return (
    <>
      <Header active="/dashboard" />
      <main className="shell user-home">
        <section className="home-hero">
          <div><p className="eyebrow">V2G Knowledge Management</p><h1 className="section-title">User Home</h1></div>
          <div className="member-strip"><span>Member: <strong>{member.name}</strong></span><span>Membership: <strong>{member.membership}</strong></span><span className="badge">{member.status}</span></div>
        </section>
        <section id="announcements" className="home-section">
          <div className="section-head"><div><p className="eyebrow">Top Section</p><h2 className="section-title">Announcement</h2></div><span className="meta">4 columns from Google Sheet DB</span></div>
          <div className="grid grid-4">{publishedAnnouncements.map((item) => <AnnouncementCard item={item} compact key={item.id} />)}</div>
        </section>
        <section id="learning" className="home-section">
          <div className="section-head"><div><p className="eyebrow">Embedded YouTube</p><h2 className="section-title">Recommend Learning</h2></div><div className="grid mini-stats"><StatCard label="Learning" value={publishedLearning.length} /><StatCard label="Views" value={publishedLearning.reduce((sum, item) => sum + item.views, 0)} /></div></div>
          <div className="grid grid-3">{publishedLearning.map((item) => <KnowledgeCard item={item} key={item.id} />)}</div>
        </section>
        <section id="profiles" className="home-section">
          <div className="section-head"><div><p className="eyebrow">People</p><h2 className="section-title">Profile</h2></div></div>
          <div className="profile-grid">{publishedProfiles.map((profile) => <article className="profile-card" key={profile.id}><img src={profile.image} alt="" /><div className="profile-card-body"><h3>{profile.name}</h3><span className="profile-title-chip">{profile.visibility}</span><p className="muted">{profile.bio}</p></div></article>)}</div>
        </section>
      </main>
    </>
  );
}
