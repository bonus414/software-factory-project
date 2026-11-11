# Coding standards

## Fail with a thrown response, not a return value

A loader or an action that cannot continue throws. It does not return an
error shape for the component to unpack.

```ts
if (!course) throw data("Course not found", { status: 404 });
```

The route then has one success path. A returned error shape gives every
component a second path to forget about.

## Parse untrusted input with a schema

Form data, search parameters and request bodies get a zod schema before the
values reach any query. Do not read `formData.get("x") as string`. The cast
is a lie the type checker believes.

## Do not write `any`, and do not write `!`

Both switch the type checker off at the exact point you are least sure. If a
value can be missing, narrow it with a check. If you cannot name the type,
the shape is wrong — fix the shape.

## Let the code explain itself

Use clear names and extract meaningful functions before adding explanatory
comments. Keep comments for reasons or constraints the code cannot express;
record substantial design decisions in an ADR. When behavior changes, review
nearby comments for drift.

## Arrange tests through module functions

Arrange behavior under test through the module's existing public functions.
Use shared fixture helpers for prerequisite records when no suitable function
exists. Add production APIs when the domain needs them, rather than solely to
support test setup.

## Trace privacy promises across boundaries

When the glossary or spec promises privacy, trace every reader and writer:
queries, server responses, actions, and staff screens. Verify that server-side
ownership and access checks uphold the promise even when the UI is bypassed.
