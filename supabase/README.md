# VANTYR — Activate the DM Observer

Your existing Blood Codex works normally without these steps. The public website **does not** provide live status to a DM until this one-time database setup is completed.

## 1. Set up the private Supabase tables (only the owner does this)

1. Open your Supabase project dashboard: https://supabase.com/dashboard/project/ibpdvibjrkljbxyvvyfz
2. Choose **SQL Editor** → **New query**.
3. Open [vantyr_observer_setup.sql](./vantyr_observer_setup.sql) from this repository and copy its contents to the SQL Editor.
4. Replace **CHANGE_TO_YOUR_EMAIL@example.com** with the **exact email address you want to use to sign in to the VANTYR player app** (your own email, not your DM's).
5. Click **Run**. No database password or secret key belongs in the app or this repository.

This creates two protected tables and five narrowly scoped database functions. Direct anonymous table access is explicitly denied. The only anonymous function requires a cryptographically random, 256-bit DM invitation token. The owner is authenticated by a verified Supabase magic link.

## 2. Allow the login redirect (only the owner)

In Supabase: **Authentication** → **URL Configuration**:

- **Site URL:** `https://vegesotos.github.io/Vantyr-Blood-Codex/`
- **Redirect URLs:** include `https://vegesotos.github.io/Vantyr-Blood-Codex/` and `https://vegesotos.github.io/Vantyr-Blood-Codex/index.html`

Supabase Email authentication/magic links must be enabled. The default magic-link email template works; no special DM provider is needed.

## 3. Sign in and activate player synchronization

1. Open your normal app: https://vegesotos.github.io/Vantyr-Blood-Codex/
2. Tap **◉ DM Sync**.
3. Enter the **same owner email** configured in the SQL.
4. Tap **Send Sign-in Link**. Open the link from the email in the same browser/device where you normally play Vantyr, so your local character data is available for synchronization.
5. When the app returns, it will claim owner access and synchronize **only a selected combat-status summary**. Your full character storage, inventory, and account data are not published.
6. In **DM Sync**, tap **Create / Replace DM Link**, then **Copy Private Link**. Send it directly to your DM.

Your DM simply visits the link: **no Supabase, GitHub, or other account required**. Their dashboard is read-only and refreshes approximately every 2.5 seconds when connected.

## 4. Revoke access at any time

In the player app, open **DM Sync** and select **Revoke DM Link**. Issuing a new DM link automatically invalidates the old one. Do not share your DM invitation link publicly; it acts as a password. A lost link can always be replaced.

The **DM Sync** button can be closed or ignored during play. The Blood Codex remains fully offline-capable. If your connection drops, the DM dashboard shows the last synchronized values and indicates that they are stale.

## Security notes

- The public Supabase **publishable key** is safe to store in the browser app; Supabase secret/service-role keys are **never** used here.
- The DM link contains 32 random bytes (64 hexadecimal digits) generated with `crypto.getRandomValues`. Only its SHA-256 hash is saved server-side.
- The token is placed in the URL **fragment** (after `#`); that fragment is not sent in a normal HTTP request to GitHub Pages.
- All DM reads require the token; database functions enforce ownership server-side for writes.
- The viewer cannot use the public key to update status or manage links.
- Changes normally become visible within a few seconds, **not an instantaneous WebSocket stream**.
