import { AnnouncementCard } from "@/components/Cards";
import { Header } from "@/components/Header";
import { announcements } from "@/lib/data";

export default function AnnouncementsPage() {
  return (
    <>
      <Header active="/announcements" />
      <main className="shell">
        <h1 className="section-title">Announcements</h1>
        <div className="section-rule" />
        <section className="grid grid-2">{announcements.map((item) => <AnnouncementCard item={item} key={item.id} />)}</section>
      </main>
    </>
  );
}
