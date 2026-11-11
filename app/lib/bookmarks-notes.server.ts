import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "~/db/schema";
import { bookmarks, notes, lessons, modules, courses } from "~/db/schema";
import { noteBodySchema } from "./bookmarks-notes";
import { and, desc, eq } from "drizzle-orm";

type Db = BetterSQLite3Database<typeof schema>;

export function getBookmark(db: Db, userId: number, lessonId: number) {
  return db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId)))
    .get();
}

export function toggleBookmark(
  db: Db,
  userId: number,
  lessonId: number,
  now = new Date()
) {
  return db.transaction(() => {
    const existing = getBookmark(db, userId, lessonId);
    if (existing) {
      db.delete(bookmarks).where(eq(bookmarks.id, existing.id)).run();
      return false;
    }
    db.insert(bookmarks)
      .values({ userId, lessonId, createdAt: now.toISOString() })
      .run();
    return true;
  });
}

export function getNote(db: Db, userId: number, lessonId: number) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .get();
}

export function saveNote(
  db: Db,
  userId: number,
  lessonId: number,
  body: string,
  now = new Date()
) {
  const trimmed = noteBodySchema.parse(body);
  if (!trimmed) {
    db.delete(notes)
      .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
      .run();
    return;
  }
  const timestamp = now.toISOString();
  return db
    .insert(notes)
    .values({
      userId,
      lessonId,
      body: trimmed,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: [notes.userId, notes.lessonId],
      set: { body: trimmed, updatedAt: timestamp },
    })
    .returning()
    .get();
}

const lessonRef = {
  lessonId: lessons.id,
  lessonTitle: lessons.title,
  moduleTitle: modules.title,
  courseId: courses.id,
  courseTitle: courses.title,
  courseSlug: courses.slug,
};

// Only the owner's Lesson and Saved loaders consume these private records.
// The routes enforce current content access; retained rows survive a Refund.
export function getSaved(db: Db, userId: number) {
  const savedBookmarks = db
    .select({ id: bookmarks.id, createdAt: bookmarks.createdAt, ...lessonRef })
    .from(bookmarks)
    .innerJoin(lessons, eq(bookmarks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .all();
  const savedNotes = db
    .select({
      id: notes.id,
      body: notes.body,
      updatedAt: notes.updatedAt,
      ...lessonRef,
    })
    .from(notes)
    .innerJoin(lessons, eq(notes.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.id))
    .all();
  return { savedBookmarks, savedNotes };
}
