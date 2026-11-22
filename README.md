# Murang’a Sokoni

A mobile-first marketplace for buyers and sellers across Murang’a County. Browse public listings, search by product, filter by category and town, register with a Kenyan phone number, and manage seller-owned listings.

## Supabase setup

The app uses the Supabase project already configured in `js/auth.js`. The browser key there is the Supabase **anon/public** key, not a service-role secret; never place a service-role key in frontend code.

Before deploying these seller features:

1. Open the linked Supabase project and run [`supabase/migrations/0001_marketplace.sql`](supabase/migrations/0001_marketplace.sql) in the SQL Editor. It creates/extends the listings table, enables row-level security, and creates the public product-images bucket with seller-owned upload rules.
2. In Supabase Authentication settings, enable **Phone** sign-in and configure an SMS provider if phone confirmation is enabled. Kenyan numbers are submitted in `+254…` format. For development, use the provider’s supported test numbers/OTP settings.
3. Confirm the project’s allowed redirect/site URLs include the deployed marketplace URL. Phone/password login and signup do not require an email redirect, but this is useful for other auth flows.
4. Publish the static site from the repository root. No build step or server is required; `index.html` is the entry point.

The public marketplace can show records with the existing `listings` table. Seller registration, seller-owned dashboards, listing edits/deletes, and image uploads need the migration and phone auth configuration above. Existing prototype rows remain publicly visible but do not get assigned to a seller automatically.

## Local preview

Serve the repository root over HTTP (rather than opening pages via `file://`), for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Supabase must be reachable from the browser, and the SQL/auth setup must be complete for the seller flows.
