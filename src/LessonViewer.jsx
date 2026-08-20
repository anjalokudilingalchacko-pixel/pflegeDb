/**
 * LessonViewer.jsx — steps through a course's lessons one at a time
 * (text / video / quiz), marking progress via the /api/elearning endpoints.
 * The piece the original design didn't have — a real course can't work
 * without somewhere to actually present and complete lesson content.
 */

import React, { useState, useMemo } from "react";
import { apiCompleteLesson, apiSubmitQuiz, ProgressBar } from "./elearningShared";

function flattenLessons(course) {
  return course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));
}

export default function LessonViewer({ course, onClose, onFinished }) {
  const lessons = useMemo(() => flattenLessons(course), [course]);
  const firstIncomplete = lessons.findIndex(l => !l.completed);
  const [activeIndex, setActiveIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [certificateEarned, setCertificateEarned] = useState(false);
  const [completedIds, setCompletedIds] = useState(() => new Set(lessons.filter(l => l.completed).map(l => l.id)));

  const lesson = lessons[activeIndex];
  const isLast = activeIndex === lessons.length - 1;
  const lessonComplete = completedIds.has(lesson.id);

  const goTo = (idx) => {
    setActiveIndex(idx);
    setQuizAnswers({});
    setQuizResult(null);
    setError("");
  };

  const markDone = (certIssued) => {
    setCompletedIds(prev => new Set(prev).add(lesson.id));
    if (certIssued) setCertificateEarned(true);
    if (isLast) {
      setDone(true);
    } else {
      goTo(activeIndex + 1);
    }
  };

  const handleCompleteTextVideo = async () => {
    if (lessonComplete) {
      if (isLast) setDone(true); else goTo(activeIndex + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { certificateIssued } = await apiCompleteLesson(course.id, lesson.id);
      markDone(certificateIssued);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const answers = lesson.quiz.questions.map((_, i) => quizAnswers[i] ?? -1);
    setSubmitting(true);
    setError("");
    try {
      const result = await apiSubmitQuiz(course.id, lesson.id, answers);
      setQuizResult(result);
      if (result.passed) markDone(result.certificateIssued);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const retryQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
  };

  const overallProgress = Math.round((completedIds.size / lessons.length) * 100);

  return (
    <div className="lv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{LESSON_VIEWER_CSS}</style>
      <div className="lv-modal">
        <div className="lv-head">
          <div>
            <div className="lv-course-title">{course.title}</div>
            {!done && <div className="lv-lesson-count">Lektion {activeIndex + 1} von {lessons.length} · {lesson.moduleTitle}</div>}
          </div>
          <button className="lv-close" onClick={() => { onFinished(); onClose(); }}>&times;</button>
        </div>
        <ProgressBar percent={overallProgress} color="#0052cc" height={5} />

        {done ? (
          <div className="lv-completion">
            <div className="lv-completion-icon">🎉</div>
            <h3>Kurs abgeschlossen!</h3>
            <p>Du hast alle Lektionen von „{course.title}“ erfolgreich abgeschlossen.</p>
            {certificateEarned && (
              <div className="lv-cert-banner">🏅 Zertifikat „{course.certificateTitle}“ wurde ausgestellt — zu finden unter Zertifizierungen.</div>
            )}
            <button className="lv-primary-btn" onClick={() => { onFinished(); onClose(); }}>Fertig</button>
          </div>
        ) : (
          <>
            <div className="lv-body">
              <h2 className="lv-lesson-title">{lesson.title}</h2>

              {lesson.type === 'text' && (
                <p className="lv-text-content">{lesson.content}</p>
              )}

              {lesson.type === 'video' && (
                <div className="lv-video-block">
                  <div className="lv-video-placeholder">▶</div>
                  {lesson.videoUrl ? (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="lv-video-link">Video in neuem Tab ansehen</a>
                  ) : (
                    <div className="lv-video-link" style={{ color: '#94a3b8' }}>Kein Video hinterlegt</div>
                  )}
                </div>
              )}

              {lesson.type === 'quiz' && (
                <div className="lv-quiz-block">
                  {lesson.quiz.questions.map((q, qi) => (
                    <div className="lv-quiz-question" key={qi}>
                      <div className="lv-quiz-q-text">{qi + 1}. {q.q}</div>
                      <div className="lv-quiz-options">
                        {q.options.map((opt, oi) => {
                          const checked = quizAnswers[qi] === oi;
                          const showFeedback = !!quizResult;
                          const isCorrectOpt = showFeedback && quizResult.results[qi].correctIndex === oi;
                          const isWrongPick = showFeedback && checked && !isCorrectOpt;
                          return (
                            <label
                              key={oi}
                              className={`lv-quiz-option ${checked ? "checked" : ""} ${isCorrectOpt ? "correct" : ""} ${isWrongPick ? "wrong" : ""}`}
                            >
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                checked={checked}
                                disabled={!!quizResult}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {quizResult && (
                    <div className={`lv-quiz-result ${quizResult.passed ? "pass" : "fail"}`}>
                      {quizResult.passed
                        ? `✓ Bestanden mit ${quizResult.scorePercent}%!`
                        : `✗ Nicht bestanden (${quizResult.scorePercent}%, mind. 70% nötig). Bitte erneut versuchen.`}
                    </div>
                  )}
                </div>
              )}

              {error && <div className="lv-error">{error}</div>}
            </div>

            <div className="lv-footer">
              <button className="lv-outline-btn" onClick={onClose}>Später weitermachen</button>
              {lesson.type === 'quiz' ? (
                quizResult && !quizResult.passed ? (
                  <button className="lv-primary-btn" onClick={retryQuiz}>Erneut versuchen</button>
                ) : (
                  <button
                    className="lv-primary-btn"
                    disabled={submitting || quizResult?.passed || lesson.quiz.questions.some((_, qi) => quizAnswers[qi] === undefined)}
                    onClick={handleSubmitQuiz}
                  >
                    {submitting ? "Wird geprüft…" : "Quiz abgeben"}
                  </button>
                )
              ) : (
                <button className="lv-primary-btn" disabled={submitting} onClick={handleCompleteTextVideo}>
                  {submitting ? "…" : lessonComplete ? (isLast ? "Abschließen" : "Weiter") : (isLast ? "Lektion abschließen & Kurs beenden" : "Als erledigt markieren & weiter")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const LESSON_VIEWER_CSS = `
  .lv-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.65); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .lv-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 26px 28px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; }
  .lv-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .lv-course-title { font-weight: 900; font-size: 1.05rem; color: #0f2942; }
  .lv-lesson-count { font-size: .82rem; color: #64748b; font-weight: 600; margin-top: 2px; }
  .lv-close { background: #f1f5f9; border: none; border-radius: 999px; width: 30px; height: 30px; font-size: 1.2rem; color: #64748b; cursor: pointer; flex-shrink: 0; }
  .lv-body { margin: 22px 0; }
  .lv-lesson-title { font-size: 1.3rem; font-weight: 900; color: #0f2942; margin: 0 0 14px; }
  .lv-text-content { font-size: .95rem; line-height: 1.65; color: #334155; white-space: pre-wrap; }
  .lv-video-block { background: #0f2942; border-radius: 14px; padding: 40px; text-align: center; color: #fff; }
  .lv-video-placeholder { font-size: 2.4rem; margin-bottom: 12px; }
  .lv-video-link { color: #93c5fd; font-weight: 700; text-decoration: underline; }
  .lv-quiz-block { display: flex; flex-direction: column; gap: 20px; }
  .lv-quiz-q-text { font-weight: 800; font-size: .95rem; color: #0f2942; margin-bottom: 10px; }
  .lv-quiz-options { display: flex; flex-direction: column; gap: 8px; }
  .lv-quiz-option { display: flex; align-items: center; gap: 10px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; font-size: .88rem; color: #334155; cursor: pointer; }
  .lv-quiz-option.checked { border-color: #0052cc; background: #f0f7ff; }
  .lv-quiz-option.correct { border-color: #10b981; background: #ecfdf5; color: #065f46; font-weight: 700; }
  .lv-quiz-option.wrong { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
  .lv-quiz-result { border-radius: 10px; padding: 12px 16px; font-weight: 800; font-size: .9rem; }
  .lv-quiz-result.pass { background: #d1fae5; color: #065f46; }
  .lv-quiz-result.fail { background: #fee2e2; color: #991b1b; }
  .lv-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 10px 14px; font-size: .85rem; margin-top: 14px; }
  .lv-footer { display: flex; justify-content: space-between; gap: 12px; }
  .lv-primary-btn { background: #0052cc; color: #fff; border: none; border-radius: 10px; padding: 12px 22px; font-weight: 800; font-size: .88rem; cursor: pointer; }
  .lv-primary-btn:disabled { opacity: .55; cursor: default; }
  .lv-outline-btn { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 18px; font-weight: 700; font-size: .88rem; cursor: pointer; }
  .lv-completion { text-align: center; padding: 30px 10px 10px; }
  .lv-completion-icon { font-size: 3rem; margin-bottom: 10px; }
  .lv-completion h3 { font-size: 1.4rem; font-weight: 900; color: #0f2942; margin: 0 0 8px; }
  .lv-completion p { color: #64748b; font-size: .92rem; margin: 0 0 18px; }
  .lv-cert-banner { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 12px; padding: 14px 18px; font-weight: 700; font-size: .88rem; margin-bottom: 22px; }
`;
