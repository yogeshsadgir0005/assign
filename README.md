# Products admin

A small admin dashboard for the [DummyJSON](https://dummyjson.com) catalogue: sign in, browse
products, search, filter, sort, page through them, and add, edit or delete a product.

Next.js (App Router) · React · Tailwind CSS · Axios · TypeScript.

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and sign in with the DummyJSON demo account:

| Username | Password     |
| -------- | ------------ |
| `emilys` | `emilyspass` |

Other scripts: `npm run build`, `npm start`, `npm run lint`.

No environment variables are needed. `NEXT_PUBLIC_API_BASE_URL` can point the app at a different
host, which is how the failure states were tested against a dead one — see `.env.example`.

## What's built

**Auth**

- Sign in through `POST /auth/login`; wrong details get one plain message, not a stack trace.
- The token and user are kept in `localStorage` behind a small store that the Axios interceptor,
  the top bar and the route guard all read from.
- `/products` and `/products/[id]` render nothing until the token is confirmed, so a signed-out
  visitor never sees a flash of the catalogue.
- Sign out clears the session. Signing out in one tab signs out the others.

**List**

- Table on desktop, cards on mobile, where the whole card is tappable.
- Pagination through `limit` and `skip`, with page numbers windowed as `1 … 5 6 7 … 10`,
  Previous/Next, a page size of 10, 20 or 50, and a `Showing 41–60 of 194` count.
- Search through `/products/search?q=`, debounced 400 ms, resetting to page 1.
- Category filter from `/products/categories` and sorting by title, price or rating — server-side
  through `sortBy` and `order`, so it sorts the whole result set rather than the current page.
  Column headers sort too, and show which one is active.
- Every one of those lives in the URL, so a refresh or a shared link reproduces the exact view.

**Product details** — `/products/[id]` with the image gallery, description, price, rating, stock,
shipping and warranty, and the reviews. A wrong id gets its own "Product #9999 doesn't exist" page.

**Add, edit, delete** — a validated form for adding and editing, and a confirmation that names the
product before deleting it. Writes are merged in locally and marked as such; see the note below.

**States** — skeleton rows that match the table instead of a spinner, an empty state that repeats
what was searched for, and errors that distinguish an unreachable API from a timeout, a 404 and a
5xx, each with its own copy and a Retry where retrying could help.

## How it's put together

```
src/
  api/          one module per endpoint group (auth, products) — no fetching inside components
  lib/http.ts   the single Axios instance: bearer token in, ApiError out
  lib/          session store, URL query parsing, local-write overlay, formatting
  hooks/        useProductList, useProduct, useCategories, useDebouncedValue
  components/   ui/ primitives, products/ screens, all small enough to read in one sitting
  app/          routes only; each page is a Suspense boundary around a client screen
```

One Axios instance does the cross-cutting work. A request interceptor attaches the bearer token; a
response interceptor turns every failure into a typed `ApiError` with a `kind`
(`offline`, `timeout`, `not-found`, `server`, …), so components phrase errors instead of poking at
status codes, and a 401 clears the session from that one place.

## Decisions worth knowing about

**Search and category can't combine.** DummyJSON has `/products/search?q=` and
`/products/category/{slug}` as separate endpoints, with no parameter that applies both. When both
are set the app searches the whole catalogue and says so above the table, offering to clear the
search or drop the filter. The alternative — filtering the current page in the browser — would
make the result count and the pagination lie, which is worse than an explanation.

**Writes are not stored by the API.** `POST /products/add` answers 201 with id 195 every time,
`PUT` and `DELETE` answer 200, and the next `GET` returns the untouched catalogue. So the app sends
the request, and keeps the accepted response in a session-scoped overlay that is merged over API
results: edited rows carry a `LOCAL` tag, deleted rows disappear, added rows are pinned to the top
of page 1 with `new` in place of an id. A banner reports what is local and clears it on request.
Nothing is presented as saved that isn't.

**Bad URL values are corrected, not rejected.** `?page=abc` reads as page 1, `?limit=17` falls back
to 20, `?sort=bogus` to no sort, and `?page=999` clamps to the last page once the total is known.
The URL is then tidied with `router.replace`, so the Back button still walks through the views you
actually saw. Typing in the search box replaces the history entry; changing a filter pushes one.

**Old responses can't overwrite new ones.** Each list request aborts the one before it, its cleanup
marks the in-flight call stale, and the stored result carries the key it was fetched for — the
status is derived by comparing that key with the current one, so a late response is dropped rather
than rendered. To see it, add `?delay=2000` to the app's own URL: the value is forwarded to every
API call. Type a word, replace it mid-flight, and the first result never lands.

**Repeated clicks send one request.** Sign in, Save and Delete disable themselves only while a
request is in flight, and return early if one already is.

## Known limits

- The 401 branch of the interceptor signs you out and explains why on the login page, but
  DummyJSON's product endpoints are public, so only `/auth/*` can actually trigger it.
- Locally added products are pinned to page 1 rather than sorted into position, because their place
  in a server-sorted result set isn't knowable from one page of it.
- Local changes live in `sessionStorage`, so they last for the tab and not beyond it.
