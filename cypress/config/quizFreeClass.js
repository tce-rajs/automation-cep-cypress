// A class/chapter/topic whose Playlist contains NO Quiz.
//
// This is test data D03 from the reworked Quiz workbook ("Playlist without
// Quiz"), and it is the precondition TC-QUIZ-002 needs: branch B of the F02
// decision can only be exercised from a Playlist where the Quiz is genuinely
// absent, so that navigating to it is a real step rather than a no-op.
//
// The configured target class (cypress/config/targetClass.js) cannot supply
// it -- its topic always holds two quizzes -- so the case searched the other
// chapters and skipped itself when it found none. This class was supplied for
// exactly that purpose.
//
// Same convention as targetClass.js: chapter and topic are INDEXES, not names,
// because names are curriculum-specific and vanish when the account is pointed
// at a different school, whereas "the first chapter" always resolves.
//
// If this class ever gains a Quiz, TC-QUIZ-002 fails with a message saying so
// rather than passing vacuously -- the precondition would no longer hold, and
// that is worth knowing rather than hiding.
module.exports = {
  grade: "Class 7",
  division: "A",
  subject: "English Language",
  chapterIndex: 0, // 0 = first chapter in the Chapters popup
  topicIndex: 0, // 0 = first topic under that chapter
};
