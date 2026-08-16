// The class/chapter/topic every module tests against when it needs a real,
// specific class instead of whatever the account happened to leave active
// last. Change these four values whenever a different class is assigned for
// testing -- every spec that calls PlaylistPage.goToTargetClass() will pick
// up the new target automatically, no other file needs to change.
module.exports = {
  grade: "Class 8", // e.g. "Class 8"
  division: "A", // e.g. "A"
  subject: "Computer Science", // e.g. "Computer Science"
  chapter: "Photoshop", // exact chapter name as shown in the Chapters popup
  topicIndex: 0, // 0 = first topic under that chapter, 1 = second, etc.
};
