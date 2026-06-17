"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredUser, getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { Lesson, QuizQuestion } from "@/lib/types";

export default function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const user = getStoredUser();
  const { isCompleted, markComplete } = useProgress(user?.id ?? "");

  useEffect(() => {
    fetch("/api/learning", { headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const all = Array.isArray(d.lessons) ? (d.lessons as Lesson[]) : [];
        const found = all.find((l) => l.id === lessonId) ?? null;
        setLesson(found);
        setAllLessons(all.filter((l) => l.pathId === id).sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, lessonId]);

  useEffect(() => {
    if (!lesson) return;
    const token = getUserToken();
    if (!token || typeof window === "undefined") return;
    const key = `v2g-audit-open-lesson:${lesson.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    fetch("/api/learning/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "open_lesson", pathId: id, lessonId: lesson.id }),
    }).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [id, lesson]);

  function submitQuiz() {
    if (!lesson) return;
    const quiz = lesson.quiz ?? [];
    const correct = quiz.filter((q, i) => answers[i] === q.correctIndex).length;
    const pct = quiz.length ? Math.round((correct / quiz.length) * 100) : 100;
    setScore(pct);
    setSubmitted(true);
    if (pct >= (lesson.passingScore ?? 100)) {
      markComplete(lesson.id, id, pct);
    }
  }

  const alreadyDone = isCompleted(lessonId);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = allLessons[currentIndex + 1];
  const passed = submitted && lesson ? score >= (lesson.passingScore ?? 100) : false;

  return (
    <AppShell>
      <div style={{ marginBottom: 8 }}>
        <Link href={`/learning/${id}`} className="muted-link">← กลับ</Link>
      </div>

      {loading ? <Skeleton rows={6} /> : null}

      {lesson ? (
        <div style={{ maxWidth: 780 }}>
          <div className="section-head">
            <div>
              <p className="eyebrow">บทที่ {lesson.order}</p>
              <h1 style={{ fontSize: 20 }}>{lesson.title}</h1>
            </div>
            {alreadyDone ? <Badge tone="green">เรียนจบแล้ว ✓</Badge> : null}
          </div>

          <p style={{ color: "var(--secondary)", fontSize: 13, marginBottom: 20 }}>{lesson.description}</p>

          {/* Video */}
          <div style={{ position: "relative", paddingTop: "56.25%", background: "var(--surface-container)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 24 }}>
            <iframe
              src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>

          {/* Quiz */}
          {lesson.quiz && lesson.quiz.length > 0 ? (
            <div className="panel" style={{ marginBottom: 24 }}>
              <div className="panel-head">
                <strong>แบบทดสอบท้ายบท</strong>
                <Badge tone="neutral">ผ่าน {lesson.passingScore}%</Badge>
              </div>

              {!quizStarted && !alreadyDone ? (
                <div style={{ padding: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--secondary)", marginBottom: 12 }}>
                    {lesson.quiz.length} ข้อ — ต้องได้ {lesson.passingScore}% ขึ้นไปเพื่อผ่านบทเรียนนี้
                  </p>
                  <Button size="sm" onClick={() => setQuizStarted(true)}>เริ่มทำแบบทดสอบ</Button>
                </div>
              ) : null}

              {alreadyDone ? (
                <div style={{ padding: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--success)" }}>ผ่านแล้ว ✓</p>
                </div>
              ) : null}

              {quizStarted && !submitted ? (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
                  {lesson.quiz.map((q, qi) => <QuizItem key={qi} q={q} qi={qi} selected={answers[qi]} onSelect={(v) => setAnswers((prev) => ({ ...prev, [qi]: v }))} />)}
                  <Button
                    onClick={submitQuiz}
                    disabled={Object.keys(answers).length < lesson.quiz.length}
                  >
                    ส่งคำตอบ
                  </Button>
                </div>
              ) : null}

              {submitted ? (
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {lesson.quiz.map((q, qi) => <QuizItem key={qi} q={q} qi={qi} selected={answers[qi]} showAnswer />)}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8, borderTop: "1px solid var(--outline-variant)" }}>
                    <Badge tone={passed ? "green" : "red"}>{passed ? `ผ่าน ${score}%` : `ไม่ผ่าน ${score}%`}</Badge>
                    {!passed ? (
                      <Button size="sm" variant="secondary" onClick={() => { setSubmitted(false); setAnswers({}); }}>ทำใหม่</Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : !alreadyDone ? (
            <Button onClick={() => markComplete(lesson.id, id)}>ทำเครื่องหมายว่าเรียนจบแล้ว</Button>
          ) : null}

          {(alreadyDone || passed) && nextLesson ? (
            <div style={{ marginTop: 16 }}>
              <Link href={`/learning/${id}/lesson/${nextLesson.id}`}>
                <Button variant="secondary">บทถัดไป: {nextLesson.title} →</Button>
              </Link>
            </div>
          ) : null}

          {(alreadyDone || passed) && !nextLesson ? (
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <Link href={`/learning/${id}/certificate`}>
                <Button>ดูใบรับรอง 🎓</Button>
              </Link>
              <Link href={`/learning/${id}`}>
                <Button variant="secondary">กลับ Path</Button>
              </Link>
            </div>
          ) : null}
        </div>
      ) : !loading ? (
        <p style={{ color: "var(--secondary)" }}>ไม่พบบทเรียนนี้</p>
      ) : null}
    </AppShell>
  );
}

function QuizItem({ q, qi, selected, onSelect, showAnswer }: {
  q: QuizQuestion; qi: number; selected?: number; onSelect?: (i: number) => void; showAnswer?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontWeight: 600, fontSize: 14 }}>{qi + 1}. {q.question}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correctIndex;
          const isSelected = selected === oi;
          let bg = "var(--surface)";
          let border = "1px solid var(--outline-variant)";
          if (showAnswer && isCorrect) { bg = "rgba(21,87,36,0.08)"; border = "1px solid var(--success)"; }
          if (showAnswer && isSelected && !isCorrect) { bg = "rgba(186,26,26,0.08)"; border = "1px solid var(--error)"; }
          if (!showAnswer && isSelected) { bg = "var(--surface-high)"; border = "1px solid var(--primary)"; }
          return (
            <button
              key={oi}
              type="button"
              disabled={showAnswer}
              onClick={() => onSelect?.(oi)}
              style={{ textAlign: "left", background: bg, border, borderRadius: "var(--radius-sm)", padding: "8px 12px", cursor: showAnswer ? "default" : "pointer", fontSize: 13 }}
            >
              {opt}
              {showAnswer && isCorrect ? " ✓" : ""}
              {showAnswer && isSelected && !isCorrect ? " ✗" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
