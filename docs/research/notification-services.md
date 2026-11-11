# Hosted notification inbox options for Cadence

Researched 2026-11-10 (America/Chicago). This is decision support for [Compare hosted services for the Cadence notification inbox](https://github.com/bonus414/software-factory-project/issues/3), not a provider selection or implementation. Public documentation was inspected; no account, SDK installation, billing contract, or live delivery was tested. Prices are USD/month, excluding tax and downstream channel providers.

## What matters for this decision

All three shortlisted services offer a hosted inbox and a path from prebuilt React UI to custom UI. The sharpest differences are retention, billing units, and operational constraints. Knock documents indefinite feed retention and a relatively large paid-plan minimum; Novu has a lower paid entry price but finite standard inbox retention; Courier offers per-send billing and a modern inbox SDK, with some conflicting public documentation that needs confirmation. None is selected here.

Scope from the [notification map](https://github.com/bonus414/software-factory-project/issues/1): persistent in-app notifications for useful replies, decisions, and attention-required events; consider Students, Instructors, Platform Admins, and Team Admins. The event catalog and exact retention duration remain undecided. Existing Postmark email stays as-is; email and push are future evaluation criteria only. Local `package.json` currently declares React 19.2.7 and React Router 8.3.0.

## Integration comparison

| Area | Knock | Novu Cloud | Courier |
| --- | --- | --- | --- |
| UI and React | React components, hooks and feed API; explicit React 19 support. [Support](https://knock.app/changelog/2025-03-13?category=changelog), [UI options](https://knock.app/pricing) | `@novu/react` Inbox, replaceable components and headless hooks; explicitly React 18+ including 19. [Inbox](https://novu.docs7.io/platform/inbox) | Current `@trycourier/courier-react` with `CourierInbox`; prebuilt, customized, or custom feed. Vendor specifies React 18+. Avoid old `@trycourier/react-inbox` tutorials. [SDK guidance](https://www.courier.com/guides/how-to-build-a-notification-center/chapter-2-how-to-build-a-notification-center), [Inbox](https://www.courier.com/docs/in-app/inbox) |
| State | Read, seen, archive and reverse/bulk operations. [API access](https://docs.knock.app/in-app-ui/security-and-authentication) | Read/unread, archive/unarchive, delete, snooze, action completion; real-time count hooks. [Methods](https://novu.docs7.io/platform/inbox/migration-guide), [headless](https://novu.docs7.io/platform/inbox/headless-mode) | Unread counts, unread/archive views, actions, pagination; read/archive sync across devices. [Inbox](https://www.courier.com/docs/in-app/inbox) |
| Identity | Server secret key for triggers; public browser key plus server-signed user JWT. Enable enhanced security: it is off by default, and a public key alone can impersonate users. Grants can restrict endpoints/tenants. [Security](https://docs.knock.app/in-app-ui/security-and-authentication) | Server API secret; enable HMAC and generate subscriber hash server-side from authenticated user ID. Context also needs a signed hash when used. [Production setup](https://novu.docs7.io/platform/inbox/prepare-for-production) | Server-minted user JWT; refresh before expiration and call `signIn` again. Never expose workspace API keys. [Authentication pattern](https://www.courier.com/guides/how-to-build-a-notification-center/chapter-2-how-to-build-a-notification-center) |
| Local development | Isolated environments are included; use test users and production-like security. [Plans](https://knock.app/pricing) | Dev and Prod environments on Free/Pro, additional environments on higher plans; subscribers and keys are environment-specific. [Glossary](https://novu.docs7.io/platform/additional-resources/glossary) | Test and production keys choose separate environments; sends from all environments count toward billing. [Environments](https://www.courier.com/docs/workspaces/environments), [billing](https://www.courier.com/docs/workspaces/billing) |

React Router integration is an engineering inference, not a tested vendor guarantee: authenticate in a server loader/resource endpoint, return only the signed recipient credential, and mount the inbox in a browser-safe component. Validate SSR/hydration, navigation callbacks, keyboard behavior, token expiry, and user switching with the exact installed SDK version. No source examined certifies this repository's React Router 8 combination.

## Event delivery, retries, and outages

- **Knock:** trigger workflows on the server with recipient IDs and event data. `Idempotency-Key` applies to workflow triggers only, with a default 24-hour window and matching-body enforcement; only successful responses are cached. [API reference](https://docs.knock.app/api-reference/overview). Failed workflow steps have up to three total attempts; dashboard retry resumes failed runs subject to documented limits. Delivery errors have separate statuses/retry handling. [Workflow debugging](https://docs.knock.app/send-notifications/debugging-workflows), [message statuses](https://docs.knock.app/send-notifications/message-statuses).
- **Novu:** server trigger API; use `Idempotency-Key`, not merely `transactionId`, for API-level deduplication and billing protection. **It is not enabled for every organization: support may need to enable it.** Successful and error responses cache for 24 hours; concurrent duplicates can return 409. [Idempotency](https://docs.novu.co/api-reference/idempotency). Inbox messages are stored internally and pushed by websocket; external email/SMS/chat/push sends are attempted once without general automatic retry/failover. That limitation concerns future channels, not an external provider behind the current inbox. [Retry policy](https://novu.docs7.io/platform/developer/delivery-retries).
- **Courier:** send a template to the server-selected user through the inbox channel. Supports an idempotency header. Current first-party material conflicts on the default window: a recipe says 25 hours with an explicit expiration override, while another article says 24. Treat the exact window as unverified until checked against the chosen API/account. [Recipe](https://www.courier.com/recipes/payment-receipt-email), [retry description](https://www.courier.com/blog/customer-messaging-tools-without-engineers). The latter describes automatic provider retries/backoff and failover; this is not evidence of a guaranteed retry schedule during a Courier-wide outage.

**Proposed application responsibility, not an approved design:** record the domain change and a durable dispatch record atomically; send asynchronously with a stable event/recipient key, bounded backoff, visible failure state, and manual recovery. A vendor cannot retry an event it never received. Keep deduplication records beyond vendor windows. Reconcile ambiguous timeouts before replaying an old event. Do not block a successful refund decision or reply on inbox availability; show unavailable/retry UI rather than a misleading empty inbox.

## Retention and deletion

| Service | Published behavior | Decision consequence |
| --- | --- | --- |
| Knock | Feed items remain accessible indefinitely; message/debug logs expire after 30 days on non-enterprise plans and 90 on Enterprise. [Retention](https://docs.knock.app/manage-your-account/data-retention) | Long-lived inbox history is feasible, but old delivery debugging needs another strategy. Decide explicit deletion policy; indefinite availability is not an obligation to retain forever. |
| Novu Cloud | Pricing comparison lists inbox retention of 30 days Free, 90 days Pro/Team, custom Enterprise. Activity logs are separately 24h / 7 days / 90 days. [Plans](https://novu.co/pricing). Individual and bulk permanent notification deletion are exposed. [JS SDK](https://novu.docs7.io/platform/sdks/javascript) | If “persistent” means longer than 90 days, obtain an Enterprise retention quote or reconsider the storage design. |
| Courier | First-party guide says messages persist without `expiresAt` and can expire/archive. [Persistence](https://www.courier.com/guides/how-to-build-a-notification-center/chapter-4-why-choose-courier). Pricing currently contains conflicting duplicated log-retention tables (Free 7 versus 30 days). [Plans](https://www.courier.com/pricing) | Confirm contracted inbox retention, deletion semantics, and log retention before selection. Archiving must not be assumed to erase data. |

Unverified for all three: complete account-erasure cascade, backup purge timing, deletion propagation, and export/migration fidelity for historical read state. These need a focused provider confirmation once Cadence's policy is known. Send minimal summaries/IDs rather than sensitive full replies or refund details; destination routes must recheck current permissions.

## Pricing and illustrative scale

Knock Free includes 10,000 messages; Starter is $250 for 50,000, then $0.005/message. A message is one recipient on one channel; failed/bounced messages do not count. Branding removal is paid. [Knock pricing](https://knock.app/pricing).

Novu Free includes 10,000 workflow runs; Pro starts at $30 for 30,000, then $1.20/1,000; Team starts at $250 for 250,000. One run is one workflow execution for one subscriber, not each channel. Confirm rounding and feature tier at purchase. [Novu pricing](https://novu.co/pricing), [run definition](https://novu.docs7.io/platform/additional-resources/glossary).

Courier Developer includes 10,000 free sends. Business charges **$0.005 for every send**; adding a card changes the plan. A send is one template to one recipient, including multi-channel templates; failed and preference-blocked sends count, as do test sends. Do not assume the free allowance is deducted on Business. [Courier billing](https://www.courier.com/docs/workspaces/billing).

Assume one workflow/template, one in-app item per recipient, no failures/digests/test traffic or optional add-ons. These are comparison scenarios, not usage forecasts:

| Recipient notifications/month | Knock | Novu Cloud | Courier |
| --- | --- | --- | --- |
| 5,000 | $0 Free | $0 Free | $0 Developer |
| 25,000 | $250 Starter | $30 Pro | $125 Business |
| 100,000 | $500 Starter | $114 Pro (30 + 70 × 1.20) | $500 Business |

More recipients multiply usage. Future additional channels multiply Knock's message units; Novu runs and Courier template sends use different units. All support future email/push, but evaluating those channels does not authorize migration: [Knock channels](https://knock.app/pricing), [Novu channels](https://novu.co/pricing), [Courier platform](https://www.courier.com/docs/overview).

## Inputs for the human provider decision

1. Define inbox lifetime first: recent activity for 90 days versus durable history changes Novu's fit substantially.
2. Use the later prototype to decide whether prebuilt styling suffices or a custom list is required. Prototype with representative role-specific events without committing to a provider.
3. Estimate recipient fan-out, retention, and peak rate from the approved event catalog; compare paid plans with branding, support, and environment requirements included.
4. Confirm Courier's retention/idempotency details and Novu's idempotency enablement. Test authentication isolation, role changes, duplicate dispatch, reconnect, and deletion with a sandbox account before committing.

Authorization remains Cadence's responsibility for every option: compute recipients from actual permissions on the server, issue inbox credentials only for the logged-in identity, clear the old inbox on DevUI switches/logout, and reauthorize every linked decision/action. Read, seen, and completed are separate concepts; reading a notification must never itself approve a refund or resolve a request. These are integration recommendations for the later spec, not newly approved product requirements.
