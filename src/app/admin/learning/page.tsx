import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { batchListSheets } from "@/lib/google-sheets";
import type { Lesson, LearningPath } from "@/lib/types";

export default async function AdminLearningPage() {
  const data = await batchListSheets(["learning_paths", "lessons"]) as {
    learning_paths: LearningPath[];
    lessons: Lesson[];
  };

  const pathOptions = data.learning_paths.map((p) => ({ value: p.id, label: p.title }));

  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="Learning Paths"
        resource="learning_paths"
        items={data.learning_paths}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "thumbnail", label: "Thumbnail URL" },
          { key: "order", label: "Display Order" },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
      <div style={{ marginTop: 40 }}>
        <AdminResourceManager
          title="Lessons"
          resource="lessons"
          items={data.lessons.map((l) => ({ ...l, title: l.title }))}
          fields={[
            { key: "pathId", label: "Learning Path ID", type: "select", options: pathOptions },
            { key: "title", label: "Title" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "youtubeUrl", label: "YouTube URL" },
            { key: "order", label: "Display Order" },
            { key: "passingScore", label: "Passing Score (%)" },
          ]}
        />
      </div>
      {data.learning_paths.length > 0 ? (
        <PathReference paths={data.learning_paths} lessons={data.lessons} />
      ) : null}
    </AdminShell>
  );
}

function PathReference({ paths, lessons }: { paths: LearningPath[]; lessons: Lesson[] }) {
  return (
    <section className="admin-section" style={{ marginTop: 32 }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">Reference</p>
          <h1>Path IDs</h1>
        </div>
      </div>
      <div className="list-panel">
        <h2>Copy Path ID when adding lessons</h2>
        <div className="admin-list">
          {paths.map((p) => {
            const count = lessons.filter((l) => l.pathId === p.id).length;
            return (
              <div className="admin-row" key={p.id}>
                <div className="row-summary">
                  <strong>{p.title}</strong>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--secondary)", userSelect: "all" }}>{p.id}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--secondary)" }}>{count} บทเรียน</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
