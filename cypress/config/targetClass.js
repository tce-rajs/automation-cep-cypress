// The class/chapter/topic every module tests against when it needs a real,
// specific class instead of whatever the account happened to leave active
// last. Change these values whenever a different class is assigned for
// testing -- every spec that calls PlaylistPage.goToTargetClass() will pick
// up the new target automatically, no other file needs to change.
//
// Chapter and topic are selected by INDEX rather than by name. The QA account
// moved from Velammal School to Goyal Brothers, whose curriculum is entirely
// different (no "Photoshop" chapter existed, which broke every Add Resource
// suite at its beforeEach). Indexes survive that kind of content change;
// hardcoded chapter names do not.
//
// 2026-08-22: retargeted from Class 8A | Computer Science to Class 12A |
// Physics, per instruction to make 12A the suite's primary class. grade/
// division/subject strings below are NOT yet confirmed against the live
// account (need a real run to confirm "Class 12" and "Physics" render
// exactly this way in the Grade/Subject popup) -- chapterIndex/topicIndex
// are also unconfirmed to contain real Video/Worksheet/Quiz content the way
// the old Class 8A | Computer Science | Photoshop combination did. Chemistry
// is the suite's second subject (see PlaylistPage.goToClass("Class 12", "A",
// "Chemistry")); Computer Science in 12A is reserved specifically for Code
// Editor validation, called out separately rather than folded in here.
module.exports = {
  grade: "Class 12", // e.g. "Class 12"
  division: "A", // e.g. "A" -- this account currently only has "A"
  subject: "Physics", // e.g. "Physics" -- primary subject for 12A
  chapterIndex: 0, // 0 = first chapter in the Chapters popup
  topicIndex: 0, // 0 = first topic under that chapter
};
