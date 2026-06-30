# Inventory Management & Real-time Stock Sync

How Khud prevents overselling and keeps stock consistent across concurrent shoppers,
and how product stock updates live without a page refresh.

- **Stock lives on** `product_variants.stock_quantity` (one row per colour × size).
- **Stock is reserved only at checkout** — never when an item is added to the cart.
- **One migration** introduces everything: [scripts/015_inventory_checkout_and_realtime.sql](../scripts/015_inventory_checkout_and_realtime.sql).

---

## 1. Transaction flow (concurrency-safe checkout)

Checkout no longer inserts rows from the browser. It calls a single Postgres function,
`process_checkout(p_items, p_customer)`, which runs as **one transaction** with **row-level locking**.

**Client** — [components/CartContext.jsx](../components/CartContext.jsx) `placeOrder()`:

1. Verifies the user is signed in.
2. Builds `items = [{ variant_id, quantity }]` from the cart — **ids + quantities only**.
   Price and totals are *not* sent; the cart is never trusted (requirement #5).
3. `supabase.rpc("process_checkout", { p_items, p_customer })`.
4. On error, `parseCheckoutError()` turns the DB error into a precise message
   (e.g. *"Only 2 left of Heavy Tee (Bone · L). Please reduce the quantity in your bag."*).

**Database** — `process_checkout` (`SECURITY DEFINER`, single implicit transaction):

1. **Guards** — reject if not authenticated / empty cart / invalid quantity.
   Customer email is read from `auth.users`, never the client.
2. **Phase 1 — lock & verify.** For each item, ordered by `variant_id` (deterministic order
   avoids deadlocks):
   ```sql
   SELECT pv.stock_quantity, p.price, ...
   FROM product_variants pv JOIN products p ON p.id = pv.product_id
   WHERE pv.id = :variant_id
   FOR UPDATE OF pv;          -- row lock held until commit/rollback
   ```
   - missing variant → `VARIANT_NOT_FOUND`
   - `stock_quantity < quantity` → `OUT_OF_STOCK|name|color|size|available|requested`
   - otherwise add `price * quantity` (DB price) to the subtotal.
3. **Phase 2 — commit work.** Insert the `orders` row, then per item decrement
   `product_variants.stock_quantity` and insert the `order_items` row.
4. Return `{ order_id, order_number, total }`.
5. **Any exception** (incl. out-of-stock) hits `EXCEPTION WHEN OTHERS`, is logged, and is
   **re-raised → the whole transaction rolls back**. No partial order can exist (requirement #4).

**ACID guarantees**

- **Atomic / Consistent** — a plpgsql function is one transaction; on error nothing is written.
- **Isolated** — `FOR UPDATE` serialises buyers of the same variant.
- **Durable** — committed on success like any Postgres write.
- The column `CHECK (stock_quantity >= 0)` is a hard backstop: stock can never go negative.

### Concurrency (Stock = 1, User A and User B at once)

1. Both call `process_checkout` for the same variant.
2. Whoever acquires `FOR UPDATE` first proceeds; the other **blocks on the lock**.
3. First commits → stock becomes `0`.
4. The blocked transaction is granted the lock, **re-reads stock = 0**, fails the check →
   `OUT_OF_STOCK` → rolls back.
5. Result: exactly one order, stock ends at `0`, never negative — guaranteed.

---

## 2. WebSocket flow (real-time stock)

We use **Supabase Realtime** — the websocket layer already in the stack. (A standalone
`ws`/`socket.io` server is not viable on this serverless Next.js deployment.) `product_variants`
is added to the `supabase_realtime` publication, so **every** stock change — the checkout
decrement *and* admin edits in [app/admin/page.jsx](../app/admin/page.jsx) — emits a
`postgres_changes` event automatically. The DB change *is* the broadcast (requirement #4); there is
no manual emit code.

**Product page** — [components/ProductDetail.jsx](../components/ProductDetail.jsx):

- Variants are held in React state.
- A channel subscribes to `postgres_changes` on `product_variants` filtered by
  `product_id=eq.<id>`; the payload (the changed row) patches state.
- All availability (size buttons, "Sold out" tag, Add-to-bag enabled/label, and the live
  **stock count** shown near the button) derives from that state, so it updates instantly —
  **no refresh** (requirement #1). `aria-live="polite"` announces changes to screen readers.

**Grids** (home featured + `/shop/[slug]`) — [lib/useLiveStock.js](../lib/useLiveStock.js):

- One shared channel per grid subscribes to all `product_variants` changes and keeps a
  `{ variantId: stock }` map.
- Each product's `inStock` is recomputed from its lightweight `variants: [{ id, stock }]`
  (added by [lib/mapDbProduct.js](../lib/mapDbProduct.js)); a card flips to **Sold Out** — or
  back — live. Used by [components/CategoryShop.jsx](../components/CategoryShop.jsx) and
  [components/FeaturedProducts.jsx](../components/FeaturedProducts.jsx).

`product_variants` already has a public read RLS policy, so anon visitors receive events.

---

## 3. Structured logging (requirement #6)

`process_checkout` writes structured `RAISE LOG` lines (visible in Supabase → Logs → Postgres):

| Event | Log line |
|-------|----------|
| transaction started | `checkout.start uid=… items=…` |
| insufficient stock | `checkout.insufficient_stock uid=… variant=… available=… requested=…` |
| transaction committed | `checkout.commit uid=… order=… number=… total=…` |
| transaction rolled back | `checkout.rollback uid=… sqlstate=… message=…` |

A concurrent-purchase conflict surfaces as `insufficient_stock` + `rollback` for the loser.
The client also logs `[checkout] submitting / success / failed`.

---

## 4. Migration script

Run **[scripts/015_inventory_checkout_and_realtime.sql](../scripts/015_inventory_checkout_and_realtime.sql)**
once in the Supabase SQL editor (it is idempotent — safe to re-run). It:

- creates `process_checkout(jsonb, jsonb)` and grants `EXECUTE` to `authenticated`;
- sets `product_variants` to `REPLICA IDENTITY FULL`;
- adds `product_variants` to the `supabase_realtime` publication.

No schema columns change, so it introduces no breaking changes to existing code.

---

## 5. How to test concurrent checkout

**Setup:** apply migration 015. Pick a variant and set its stock to **1**
(`UPDATE product_variants SET stock_quantity = 1 WHERE id = '<variant>';`). Sign in in two
different browsers/profiles (User A, User B). Add that exact colour/size in both bags.

**Option A — UI:** open the bag → Checkout → fill shipping in both, then click **Place Order**
in both as close together as possible.

**Option B — deterministic (browser devtools console, while signed in):**
```js
const { createClient } = await import('/lib/supabase'); // or use window supabase if exposed
// fire two checkouts for the same variant at once:
const body = { p_items: [{ variant_id: '<variant>', quantity: 1 }],
               p_customer: { full_name:'T', phone:'1', address:'A', city:'C' } };
const sb = createClient();
const [a, b] = await Promise.all([ sb.rpc('process_checkout', body), sb.rpc('process_checkout', body) ]);
console.log(a.error ?? a.data, b.error ?? b.data);
```

**Expected:**
- Exactly **one** call returns `{ order_id, ... }`; the other errors with `OUT_OF_STOCK|…|0|1`.
- `SELECT stock_quantity FROM product_variants WHERE id = '<variant>'` → **0** (never negative).
- `SELECT count(*) FROM orders WHERE …` → only **one** new order; no orphan `order_items`.
- Supabase Postgres logs: two `checkout.start`, one `checkout.commit`, one
  `checkout.insufficient_stock` + one `checkout.rollback`.

---

## 6. Manual testing steps

1. **Fonts** — `npm run dev`; headings render in Hanken Grotesk; italic serif accents
   ("imprint.", "first drop.", step numbers, badges) stay Bodoni Moda italic.
2. **No reservation on add** — add an item to the bag; confirm `stock_quantity` is unchanged.
3. **Live stock, one client** — open a product; in Supabase set that variant's
   `stock_quantity = 0` → the size disables, "Sold out" appears, the count updates, no refresh.
   Set it back to a positive number → it re-enables.
4. **Live stock, two clients** — two browsers on the same product; edit stock in the admin (a
   third tab) → both update. On `/shop/<category>`, drop a product's only stock to 0 → its card
   flips to "Sold Out" live.
5. **Checkout decrement** — place an order (COD); confirm the order exists and the variant's
   stock dropped by the quantity bought, reflected live on the product page.
6. **Over-quantity guard** — try to buy more than is in stock → checkout fails with
   *"Only X left of …"* and no order is created.
7. **Cart not trusted** — tamper an item's price in devtools, then checkout → the saved order
   total uses the DB price, not the tampered value.
