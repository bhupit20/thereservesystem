# The Longevity Pyramid Static Build

This is a static, Cloudflare Pages-ready website build.

## Final locked assets used

- `assets/book-cover.jpg` from `Before-the-Alarm_v6.jpeg`
- `assets/pyramid-full.jpg` from `F044BB80-EA26-4565-9055-C45E75306DAF.jpg`
- `assets/headshot-indoor.jpg` from `headshot-MJ-I.jpg`
- `assets/headshot-outdoor.jpg` from `headshot-MJ-O.jpg`

No older duplicate assets are referenced.

## Cloudflare Pages settings

- Framework preset: None
- Build command: None
- Build output directory: project root
- Root file: `index.html`

## Hosted PDF URLs

- Chapter 1 Preview: `https://thereservesystem.com/assets/Before_the_Alarm_Chapter_1_Preview.pdf`
- Baseline Checklist: `https://thereservesystem.com/assets/Before_the_Alarm_Baseline_Checklist.pdf`

## Mailchimp form handler (Cloudflare Pages Function)

All five signup forms (`/chapter-1`, book launch, `/quiz`, `/clinicians`,
`/patient-referral`) post to `functions/api/subscribe.js`, which runs as a
Cloudflare Pages Function at `/api/subscribe`. It upserts the contact by
MD5-hashed email (`PUT /lists/{id}/members/{hash}`) and then applies the tag
in a separate call (`POST .../tags`). Upsert-by-hash is what makes tagging
reliable for contacts who already exist in the audience — the old embedded
Mailchimp form only applied tags to brand-new signups, so a returning
subscriber using a different form kept their old tag instead of picking up
the new one.

Path/tag mapping (enforced server-side, in `SOURCE_TAGS`):

| Source             | Tag(s) applied                          |
|---------------------|------------------------------------------|
| `chapter-1`         | `BOOK_LEAD`                               |
| `book-launch`       | `BOOK_LEAD`                               |
| `quiz`              | `BOOK_READER` + one of `PYR_FOUNDATION` / `PYR_STABILIZATION` / `PYR_PRECISION` |
| `patient-referral`  | `EXISTING_PATIENT`                        |
| `clinicians`        | `CLINICIAN_LEAD`                          |

The endpoint rejects any tag not on the allow-list for its source, so it
can't be used to apply arbitrary tags to arbitrary contacts.

**Setup required in the Cloudflare Pages dashboard before launch traffic:**

1. Project Settings → Functions → Compatibility flags: add `nodejs_compat`
   (needed for `node:crypto` MD5 hashing). `wrangler.toml` at the repo root
   already declares this; confirm it took effect in the dashboard too.
2. Project Settings → Environment variables → add as **encrypted secrets**:
   - `MAILCHIMP_API_KEY` — Mailchimp API key for the `us19` datacenter.
   - `MAILCHIMP_LIST_ID` — `bee36545c8` (defaults to this if unset).
   - `MAILCHIMP_DC` — `us19` (defaults to this if unset).
3. Redeploy so the Function picks up the new env vars/flags.
4. Test each form on the Pages preview URL and confirm the tag lands on the
   contact in Mailchimp, including re-submitting with an email that's
   already subscribed, to confirm the fix.

This only calls the Members and Members/tags API endpoints — it never
touches campaigns. BTA email sequences stay as drafts until approved
separately.

## Before production DNS cutover

1. Chapter 1 Mailchimp capture is wired to the The Longevity Clinic audience with the `BOOK_LEAD` tag. Confirm remaining non-Chapter 1 forms before production DNS cutover.
2. Confirm privacy and terms legal copy.
3. Add final clinic addresses / booking links if desired.
4. Add Meta Pixel snippet in the marked `<head>` slots when ready.
5. Complete the Mailchimp Function setup above before full launch traffic.
6. Deploy to Cloudflare Pages preview.
7. Only after Marmar approves the preview, move DNS to Cloudflare nameservers.
