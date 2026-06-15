import { KnowledgeCard } from "@/components/Cards";
import { Header } from "@/components/Header";
import { getPublished, learning } from "@/lib/data";

export default function KnowledgePage() {
  return (
    <>
      <Header active="/knowledge" />
      <main className="shell">
        <h1 className="section-title">Knowledge</h1>
        <div className="section-rule" />
        <section className="grid grid-3">{getPublished(learning).map((item) => <KnowledgeCard item={item} key={item.id} />)}</section>
      </main>
    </>
  );
}
