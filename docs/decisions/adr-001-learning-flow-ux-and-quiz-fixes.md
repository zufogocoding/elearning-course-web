# ADR-001: Learning Flow Timer Non-Blocking UX and Quiz Client-Server Compatibility

## Status
Accepted

## Date
2026-06-16

## Context
1. **Document/Text Lesson Timer**:
   - The platform enforces a minimum reading time for document/text lessons before the user can mark them complete.
   - The initial implementation replaced the entire lesson content area with a full-screen dark overlay showing a spinner and countdown timer.
   - This was a major usability issue (users could not read the document content while the timer was ticking down, and it remained blocked even after completion).
2. **Quiz Choice Rendering**:
   - Quizzes were not workable because the choice radio buttons under each question did not render.
   - Investigation revealed a property mismatch: the backend API `/api/learning/quiz-attempts/:id/questions` returned option choices under the `options` key, while the frontend attempted to map over `questionOptions`.

## Decision
1. **Non-Blocking Timer UX**:
   - Redesign the Document/Text lesson view to immediately display the lesson text content or the document download details in a scrollable view.
   - Render a sleek, non-blocking notification banner at the top of the content panel with a ticking clock, progress bar, and status message (`Cần đọc bài viết trong: X/Y giây` or `Đã đủ điều kiện hoàn thành bài đọc!`).
2. **Flexible Option Mapping**:
   - Adjust the frontend `QuizQuestion` TypeScript interface and the JSX renderer to dynamically check for both `options` and `questionOptions` keys (`q.options || q.questionOptions`).

## Consequences
- **Improved UX**: Users can now read text articles and download documents normally while the required reading timer progresses in the background.
- **Quiz Restored**: Answer choices are now properly mapped and rendered, restoring the quiz-taking and grading flows.
- **No API Breakage**: The frontend change is backwards-compatible and handles the API payload robustly.
