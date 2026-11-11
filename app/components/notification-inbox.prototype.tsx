// THROWAWAY: three inbox variants on /dashboard?variant=A|B|C.
// Sample content and in-memory state only; no notification provider or mutations.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Dialog, Popover } from "radix-ui";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  MessageCircle,
  Receipt,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";

type Notice = {
  id: number;
  kind: "reply" | "post" | "refund";
  title: string;
  context: string;
  time: string;
  destination: string;
  unavailable?: boolean;
};
const samples: Record<string, Notice[]> = {
  Student: [
    {
      id: 1,
      kind: "reply",
      title: "Someone replied to your discussion",
      context: "React Foundations · Understanding effects",
      time: "2 minutes ago",
      destination: "Lesson discussion · Understanding effects",
    },
    {
      id: 2,
      kind: "refund",
      title: "Your Refund Request was approved",
      context: "Advanced TypeScript",
      time: "1 hour ago",
      destination:
        "Refund Request · Approved. This does not confirm that the money has been returned.",
    },
    {
      id: 3,
      kind: "reply",
      title: "Someone replied to your discussion",
      context: "React Foundations · Your first component",
      time: "Yesterday",
      destination:
        "This reply is no longer available. It may have been deleted, or you may no longer have access to this course.",
      unavailable: true,
    },
  ],
  Instructor: [
    {
      id: 4,
      kind: "post",
      title: "New discussion post",
      context: "React Foundations · Understanding effects",
      time: "5 minutes ago",
      destination: "Lesson discussion · Understanding effects",
    },
    {
      id: 5,
      kind: "post",
      title: "New discussion post",
      context: "React Foundations · Your first component",
      time: "Yesterday",
      destination: "Lesson discussion · Your first component",
    },
  ],
  "Platform Admin": [
    {
      id: 6,
      kind: "refund",
      title: "New Refund Request",
      context: "Advanced TypeScript",
      time: "10 minutes ago",
      destination: "Refund Request · Open, awaiting review",
    },
    {
      id: 7,
      kind: "refund",
      title: "New Refund Request",
      context: "React Foundations",
      time: "Yesterday",
      destination:
        "Refund Request · Already declined by another Platform Admin. Showing its current status.",
    },
  ],
  "Team Admin": [
    {
      id: 8,
      kind: "refund",
      title: "Your Refund Request was declined",
      context: "React Foundations · Team Licence",
      time: "30 minutes ago",
      destination: "Refund Request · Declined. Your Team Licence is unchanged.",
    },
  ],
};
const names = { A: "Compact popover", B: "Side drawer", C: "Inbox + preview" };
type Variant = keyof typeof names;
const control = "rounded-md border bg-background px-2 py-1 text-xs";

export function NotificationInboxPrototype() {
  const [params, setParams] = useSearchParams();
  const key = params.get("variant");
  const variant: Variant = key === "B" || key === "C" ? key : "A";
  const enabled = import.meta.env.DEV && ["A", "B", "C"].includes(key ?? "");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("Student");
  const [scenario, setScenario] = useState("Populated");
  const [read, setRead] = useState<number[]>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Notice | null>(null);
  const [showControls, setShowControls] = useState(false);
  const items = scenario === "Empty" ? [] : samples[role];
  const count = items.filter((n) => !read.includes(n.id)).length;
  const visible = items.filter((n) => filter === "All" || !read.includes(n.id));
  const cycle = (direction: number) => {
    const variants: Variant[] = ["A", "B", "C"];
    const next = variants[(variants.indexOf(variant) + direction + 3) % 3];
    setParams(
      (previous) => {
        const copy = new URLSearchParams(previous);
        copy.set("variant", next);
        return copy;
      },
      { replace: true }
    );
    setSelected(null);
    setOpen(true);
  };
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).closest(
          "input, textarea, select, button, [contenteditable], [role=tab]"
        )
      )
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        cycle(event.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  if (!enabled) return null;

  const trigger = (
    <Button
      variant="outline"
      aria-label={`Notifications, ${count} unread`}
      className="gap-2"
    >
      <Bell size={18} />
      <span className="hidden sm:inline">Notifications</span>
      {count > 0 && (
        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
          {count}
        </span>
      )}
    </Button>
  );
  const detail = selected ? (
    <div className="space-y-4 p-5" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {selected.unavailable ? "Content unavailable" : "Destination preview"}
      </p>
      <h3 className="text-lg font-semibold">{selected.context}</h3>
      <p className="text-sm leading-relaxed">{selected.destination}</p>
      <p className="text-xs text-muted-foreground">
        Prototype: the real notification would open this discussion or Refund
        Request.
      </p>
      <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
        Back to notifications
      </Button>
    </div>
  ) : (
    <div className="p-8 text-sm text-muted-foreground">
      Choose a notification to preview its destination.
    </div>
  );
  const list = (
    <div>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex gap-1" aria-label="Filter notifications">
          {["All", "Unread"].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={!count || scenario !== "Populated"}
          onClick={() =>
            setRead((previous) => [
              ...new Set([...previous, ...items.map((n) => n.id)]),
            ])
          }
        >
          <CheckCheck size={15} />
          Mark all read
        </Button>
      </div>
      {scenario === "Loading" ? (
        <div role="status" className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Loading notifications…
          </p>
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : scenario === "Error" ? (
        <div role="alert" className="space-y-3 p-8 text-center">
          <p>We couldn’t load your notifications.</p>
          <Button variant="outline" onClick={() => setScenario("Populated")}>
            Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-2 p-10 text-center">
          <Bell className="mx-auto text-muted-foreground" size={28} />
          <p className="font-medium">
            {filter === "Unread"
              ? "You’re all caught up"
              : "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === "Unread"
              ? "Your previous notifications are in All."
              : "Replies and important updates will appear here."}
          </p>
        </div>
      ) : (
        visible.map((n) => (
          <div
            key={n.id}
            className={`border-b ${read.includes(n.id) ? "" : "bg-indigo-50/60 dark:bg-indigo-950/20"}`}
          >
            <button
              className="flex w-full gap-3 p-4 text-left hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-indigo-500"
              onClick={() => {
                setRead((previous) => [...new Set([...previous, n.id])]);
                setSelected(n);
              }}
            >
              <span className="rounded-full bg-background p-2 self-start text-indigo-600">
                {n.kind === "refund" ? (
                  <Receipt size={18} />
                ) : (
                  <MessageCircle size={18} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${read.includes(n.id) ? "font-normal" : "font-semibold"}`}
                >
                  {n.title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {n.context}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {n.time}
                </span>
              </span>
              {!read.includes(n.id) && (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-indigo-600">
                  <span className="sr-only">Unread</span>
                </span>
              )}
            </button>
            <button
              className="mb-3 ml-16 text-xs text-muted-foreground underline underline-offset-4"
              onClick={() =>
                setRead((previous) =>
                  previous.includes(n.id)
                    ? previous.filter((id) => id !== n.id)
                    : [...previous, n.id]
                )
              }
            >
              Mark {read.includes(n.id) ? "unread" : "read"}
              <span className="sr-only">: {n.context}</span>
            </button>
          </div>
        ))
      )}
    </div>
  );
  const heading = (
    <div className="flex items-center justify-between border-b p-4">
      <div>
        <h2 className="font-semibold">Notifications</h2>
        <p className="text-xs text-muted-foreground">{count} unread</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Close notifications"
        onClick={() => setOpen(false)}
      >
        <X size={18} />
      </Button>
    </div>
  );
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b px-6 py-3">
        <p className="text-xs text-muted-foreground">Inbox preview · {role}</p>
        {variant === "A" ? (
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>{trigger}</Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                aria-label="Notifications"
                sideOffset={10}
                align="end"
                collisionPadding={12}
                className="z-40 max-h-[65vh] w-[min(420px,calc(100vw-24px))] overflow-y-auto rounded-xl border bg-background shadow-xl"
              >
                {heading}
                {selected ? detail : list}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ) : (
          <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
            <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Content
                aria-describedby={undefined}
                className={
                  variant === "B"
                    ? "fixed right-0 top-0 z-40 h-[calc(100dvh-100px)] w-full max-w-md overflow-y-auto border-l bg-background shadow-2xl"
                    : "fixed left-1/2 top-[8vh] z-40 max-h-[72dvh] w-[min(960px,calc(100vw-24px))] -translate-x-1/2 overflow-y-auto rounded-xl border bg-background shadow-2xl"
                }
                onInteractOutside={(event) => event.preventDefault()}
              >
                <Dialog.Title className="sr-only">Notifications</Dialog.Title>
                {heading}
                {variant === "B" ? (
                  selected ? (
                    detail
                  ) : (
                    list
                  )
                ) : (
                  <div className="grid sm:grid-cols-2">
                    <div className="sm:border-r">{list}</div>
                    <div className="bg-muted/20">{detail}</div>
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
      <div className="fixed bottom-4 left-1/2 z-[60] w-[min(580px,calc(100vw-24px))] -translate-x-1/2 rounded-xl border bg-background p-2 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous variant"
            onClick={() => cycle(-1)}
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Throwaway prototype
            </p>
            <p className="text-sm font-medium">
              {variant} · {names[variant]}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next variant"
            onClick={() => cycle(1)}
          >
            <ArrowRight size={18} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-expanded={showControls}
            onClick={() => setShowControls(!showControls)}
          >
            Scenarios
          </Button>
        </div>
        {showControls && (
          <div className="space-y-2 border-t p-2">
            <div className="flex flex-wrap gap-2">
              <label className="text-xs">
                Role{" "}
                <select
                  aria-label="Role"
                  className={control}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setSelected(null);
                  }}
                >
                  {Object.keys(samples).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                State{" "}
                <select
                  aria-label="State"
                  className={control}
                  value={scenario}
                  onChange={(e) => {
                    setScenario(e.target.value);
                    setSelected(null);
                  }}
                >
                  {["Populated", "Empty", "Loading", "Error"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button
                className={control}
                onClick={() => {
                  setRead([]);
                  setSelected(null);
                  setScenario("Populated");
                  setFilter("All");
                }}
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Proposed: opening the inbox leaves items unread; opening an item
              marks it read. Refresh resets everything.
            </p>
            <output className="block break-words font-mono text-[10px]">
              {JSON.stringify({
                variant,
                role,
                scenario,
                open,
                filter,
                unread: count,
                readIds: read,
                selectedId: selected?.id ?? null,
              })}
            </output>
          </div>
        )}
      </div>
    </>
  );
}
