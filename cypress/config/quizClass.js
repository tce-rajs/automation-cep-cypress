// Dedicated class config for the Quiz module -- separate from
// cypress/config/targetClass.js because Quiz needs a class KNOWN to hold a
// quiz resource, which is not guaranteed to be wherever targetClass.js
// points (Physics/Chemistry chapters in 12A hold only Video -- see
// claude/PROJECT_NOTES.md's "Target class config" section).
//
// 2026-08-22: retargeted from Class 7A | English Language to Class 12A |
// Computer Science, per the same 12A retarget as targetClass.js. Confirmed
// live via cypress/scratch/out/explore-12a.json: chapter 0 ("1. Functions")
// has 1 quiz card ("quizCards": 1) alongside 10 asset cards.
module.exports = {
  grade: "Class 12",
  division: "A",
  subject: "Computer Science",
  chapterIndex: 0,
  topicIndex: 0,
};
