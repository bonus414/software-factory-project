import { expectTypeOf, it } from "vitest";
import type { comments, notes } from "~/db/schema";
import { noteBodySchema } from "./bookmarks-notes";
import { renderComment } from "./comment-markdown.server";
import { markdown, plainText, type Markdown, type PlainText } from "./text-format";

it("keeps Note text separate from Comment Markdown through storage and rendering", () => {
  expectTypeOf(markdown("**hello**")).toEqualTypeOf<Markdown>();
  expectTypeOf(plainText("**hello**")).toEqualTypeOf<PlainText>();
  expectTypeOf<PlainText>().not.toExtend<Markdown>();
  expectTypeOf<(typeof notes.$inferSelect)["body"]>().toEqualTypeOf<PlainText>();
  expectTypeOf<(typeof comments.$inferSelect)["body"]>().toEqualTypeOf<Markdown>();
  expectTypeOf(noteBodySchema.parse("hello")).toEqualTypeOf<PlainText>();
  expectTypeOf<Parameters<typeof renderComment>[0]>().toEqualTypeOf<Markdown>();
});
