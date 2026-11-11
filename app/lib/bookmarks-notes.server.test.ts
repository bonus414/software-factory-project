import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createTestDb, seedBaseData, seedLesson, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { raiseRefundRequest, approveRefundRequest } from "./refunds.server";
import { fakeNotifications } from "./notifications.fake.server";
import {
  getNote,
  saveNote,
  getBookmark,
  toggleBookmark,
  getSaved,
} from "./bookmarks-notes.server";

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lessonId: number;
beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);
  lessonId = seedLesson(db, base.course.id).id;
});
afterEach(() => db.$client.close());

describe("private Bookmarks and Notes", () => {
  it("accepts 2,000 characters but refuses 2,001 without changing the saved Note", () => {
    saveNote(db, base.user.id, lessonId, "a".repeat(2000));
    expect(getNote(db, base.user.id, lessonId)?.body).toBe("a".repeat(2000));
    expect(() =>
      saveNote(db, base.user.id, lessonId, "b".repeat(2001))
    ).toThrow("2,000");
    expect(getNote(db, base.user.id, lessonId)?.body).toBe("a".repeat(2000));
  });
  it("toggles a Bookmark on and off without duplicates", () => {
    expect(toggleBookmark(db, base.user.id, lessonId)).toBe(true);
    expect(getBookmark(db, base.user.id, lessonId)).toBeDefined();
    expect(toggleBookmark(db, base.user.id, lessonId)).toBe(false);
    expect(getBookmark(db, base.user.id, lessonId)).toBeUndefined();
  });

  it("replaces one plain-text Note, preserves creation time, and advances last edited", () => {
    saveNote(
      db,
      base.user.id,
      lessonId,
      " first ",
      new Date("2026-01-01T00:00:00Z")
    );
    const original = getNote(db, base.user.id, lessonId);
    expect(original?.body).toBe("first");
    saveNote(
      db,
      base.user.id,
      lessonId,
      " # Heading\n*text* ",
      new Date("2026-01-02T00:00:00Z")
    );
    expect(getNote(db, base.user.id, lessonId)).toMatchObject({
      body: "# Heading\n*text*",
      createdAt: original?.createdAt,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(getSaved(db, base.user.id).savedNotes).toHaveLength(1);
  });

  it("clears a Note when the Student saves only whitespace", () => {
    saveNote(db, base.user.id, lessonId, "private");
    saveNote(db, base.user.id, lessonId, "  ");
    expect(getNote(db, base.user.id, lessonId)).toBeUndefined();
  });

  it("lists only the owner's rows newest first with their Lesson and Course", () => {
    const second = seedLesson(db, base.course.id, "Second lesson", 2);
    const early = new Date("2026-01-01T00:00:00Z");
    const late = new Date("2026-01-02T00:00:00Z");
    toggleBookmark(db, base.user.id, lessonId, early);
    toggleBookmark(db, base.user.id, second.id, late);
    saveNote(db, base.user.id, lessonId, "first", early);
    saveNote(db, base.user.id, second.id, "second", late);
    saveNote(
      db,
      base.user.id,
      lessonId,
      "edited",
      new Date("2026-01-03T00:00:00Z")
    );
    saveNote(db, base.instructor.id, lessonId, "someone else's Note");
    toggleBookmark(db, base.instructor.id, lessonId);
    const saved = getSaved(db, base.user.id);
    expect(saved.savedBookmarks.map((row) => row.lessonTitle)).toEqual([
      "Second lesson",
      "First lesson",
    ]);
    expect(saved.savedNotes.map((row) => row.body)).toEqual([
      "edited",
      "second",
    ]);
    expect(saved.savedNotes[0]).toMatchObject({
      lessonId,
      courseTitle: "Test Course",
      courseSlug: "test-course",
    });
    expect(getNote(db, base.instructor.id, second.id)).toBeUndefined();
    expect(getBookmark(db, base.instructor.id, second.id)).toBeUndefined();
  });

  it("keeps Bookmarks and Notes when a Refund is approved", async () => {
    const now = new Date("2026-01-05T00:00:00Z");
    const notifications = fakeNotifications();
    const admin = db
      .insert(schema.users)
      .values({
        name: "Platform Admin",
        email: "admin@example.com",
        role: schema.UserRole.Admin,
      })
      .returning()
      .get();
    const purchase = db
      .insert(schema.purchases)
      .values({
        userId: base.user.id,
        courseId: base.course.id,
        amountPaid: 7900,
        createdAt: "2026-01-04T00:00:00Z",
      })
      .returning()
      .get();
    db.insert(schema.enrollments)
      .values({ userId: base.user.id, courseId: base.course.id })
      .run();
    toggleBookmark(db, base.user.id, lessonId);
    saveNote(db, base.user.id, lessonId, "Keep this for when I return.");
    const raised = await raiseRefundRequest(
      db,
      purchase.id,
      base.user.id,
      "Not for me",
      now,
      notifications
    );
    if (!raised.ok) throw new Error(raised.error);
    const approved = await approveRefundRequest(
      db,
      raised.refundRequestId,
      admin.id,
      null,
      now,
      notifications
    );
    expect(approved.ok).toBe(true);
    expect(getBookmark(db, base.user.id, lessonId)).toBeDefined();
    expect(getNote(db, base.user.id, lessonId)?.body).toBe(
      "Keep this for when I return."
    );
    expect(getSaved(db, base.user.id).savedNotes).toHaveLength(1);
  });
});
