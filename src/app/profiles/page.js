import { Header } from "@/components/Header";
import { getPublished, profiles } from "@/lib/data";

export default function ProfilesPage() {
  return (
    <>
      <Header active="/profiles" />
      <main className="shell">
        <h1 className="section-title">Profiles</h1>
        <div className="section-rule" />
        <section className="profile-grid">{getPublished(profiles).map((profile) => <article className="profile-card" key={profile.id}><img src={profile.image} alt="" /><div className="profile-card-body"><h2>{profile.name}</h2><span className="profile-title-chip">{profile.visibility}</span><p className="muted">{profile.bio}</p></div></article>)}</section>
      </main>
    </>
  );
}
