# Notes

## Why it's built this way

**The URL is the state.** Page, size, search, category and sort live in the query string and
nowhere else. Components read them through one `parseListQuery` function and write them back
through one `serializeListQuery`, which is also what makes refresh, sharing, the Back button and
"return from a product page to the same list" work without any extra code for each.

**One place per concern.** Every request goes through one Axios instance, so the token and error
handling exist once. Every endpoint lives in `src/api`, so no component knows a URL. Every local
write goes through one overlay module, so the list and the detail page agree about what changed.
When something needed fixing during the build, there was exactly one place to fix it.

**Honest states over comfortable ones.** The empty state repeats the term that found nothing.
Errors distinguish an unreachable host from a timeout, a 404 and a 5xx. Rows the API never really
stored say so. The search-plus-category conflict is explained rather than silently resolved. This
is the part I'd defend hardest: a tool that quietly does something other than what you asked is
worse than one that tells you it can't.

**Derived status, not managed status.** The fetch hooks don't flip a `loading` flag. They store the
result together with the key it was fetched for, and compare that key with the current one during
render. Fewer state transitions to get wrong, and stale responses become impossible to display
rather than merely unlikely.

## The problem that took the longest

Loading `/products?page=999` directly showed page 1 instead of clamping to page 10, and every other
URL with a query string came back stripped. The clamping logic was right, so the URL was clearly
being rewritten by something else — but nothing in my navigation code was firing.

Logging every `router.replace` call proved it: the URL changed without any of them running. That
narrowed it to a redirect outside the list screen, which left the route guard.

The cause: the session is a `useSyncExternalStore`, and during hydration React deliberately returns
`getServerSnapshot()` — which on the server is always "signed out". The guard's effect ran on that
first render, saw no token, and redirected to `/login`, which found a perfectly good token and sent
the user back to `/products` — without the query string, because `next` had been built from the
pathname alone.

Two fixes, both narrow. The guard now confirms against the store itself before redirecting, since
by the time an effect runs `localStorage` is readable; and `next` carries the full URL, so even a
legitimate trip through the login page brings the view back intact.

It's my favourite bug in the project because the symptom (pagination) was three files away from the
cause (auth), and because it only reproduced on a hard load — client-side navigation was fine the
whole time.

## The bug behind the bug

Guarding the routes with `GET /auth/me` looked finished the moment it compiled: valid tokens got
in. Then I set a deliberately broken token and reloaded — and the app let me straight through.

DummyJSON rejects a bad token with `500 {"message":"invalid token"}`, keeping 401 for a missing
header. My error mapper classified that as a server fault, which is the one category the guard
treats as "the API's problem, don't lock anyone out" — so a dead session browsed on happily.

The mapper now reads the message alongside the status, because a service that returns 500 for
"your token is wrong" is describing the failure more accurately in prose than in its status line.
Worth writing down because the code was correct against the specification and wrong against the
server, and only trying it proved which.

## Where AI helped, and where it didn't

I used Claude throughout. It was most useful for the mechanical parts: laying out the module
structure, writing the first pass of components I'd already decided the shape of, and recalling API
details like DummyJSON returning `accessToken` rather than `token`.

It was least useful where judgment was needed, and needed correcting more than once:

- Its first table used a sticky `<thead>` with `border-collapse`, which mispositions the first row
  in Chrome. Sticky had to move onto the cells with `border-separate`.
- The card wrapping the table had `overflow-hidden`, which silently traps sticky positioning. Only
  visible by looking at the running page.
- The hydration bug above was found by instrumenting and reading the logs, not by asking.

I reviewed every line, and the design constraints — one accent colour, 4px radii, tabular figures,
sentence case, no decorative animation, no invented statistics — were mine and applied against the
default output, not by it.
