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
module.exports = {
  grade: "Class 8", // e.g. "Class 8"
  division: "A", // e.g. "A" -- this account currently only has "A"
  subject: "Computer Science", // e.g. "Computer Science"
  chapterIndex: 0, // 0 = first chapter in the Chapters popup
  topicIndex: 0, // 0 = first topic under that chapter
};
