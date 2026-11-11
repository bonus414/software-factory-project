import { plainText } from "./text-format";
import { z } from "zod";

export const noteBodySchema = z
  .string()
  .trim()
  .max(2000, "Notes must be 2,000 characters or fewer.")
  .transform(plainText);
export const saveNoteSchema = z.object({
  intent: z.literal("save-note"),
  body: noteBodySchema,
});
