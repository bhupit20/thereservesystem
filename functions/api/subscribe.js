import { createHash } from "node:crypto";

// Which tags a given form is allowed to request. Keeps the public endpoint
// from being used to apply arbitrary tags to arbitrary contacts.
const SOURCE_TAGS = {
  "chapter-1": ["BOOK_LEAD"],
  "book-launch": ["BOOK_LEAD"],
  quiz: ["BOOK_READER", "PYR_FOUNDATION", "PYR_STABILIZATION", "PYR_PRECISION"],
  "patient-referral": ["EXISTING_PATIENT"],
  clinicians: ["CLINICIAN_LEAD"],
};

// Quiz result slugs, matching /quiz/results/<slug>.html exactly. Gates the
// TIER merge field so the public endpoint can't be used to write arbitrary
// strings onto a contact.
const VALID_TIERS = ["foundation", "stabilization", "precision"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function subscriberHash(email) {
  return createHash("md5").update(email.trim().toLowerCase(), "utf8").digest("hex");
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const { email, firstName, source, tags, tier, website } = payload || {};

  // Honeypot: real users never fill this hidden field in.
  if (website) return json({ ok: true });

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return json({ ok: false, error: "Enter a valid email address." }, 400);
  }

  const allowedForSource = SOURCE_TAGS[source];
  if (!allowedForSource) {
    return json({ ok: false, error: "Unknown form source." }, 400);
  }

  const requestedTags = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const safeTags = [...new Set(requestedTags.map((t) => String(t).trim()).filter(Boolean))].filter((t) =>
    allowedForSource.includes(t),
  );
  if (safeTags.length === 0) {
    return json({ ok: false, error: "No valid tag for this form." }, 400);
  }

  const apiKey = env.MAILCHIMP_API_KEY;
  const dc = env.MAILCHIMP_DC || "us19";
  const listId = env.MAILCHIMP_LIST_ID || "bee36545c8";
  if (!apiKey) {
    return json({ ok: false, error: "Server is not configured." }, 500);
  }

  const cleanEmail = email.trim();
  const hash = subscriberHash(cleanEmail);
  const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`;
  const auth = "Basic " + Buffer.from(`anystring:${apiKey}`).toString("base64");

  // The TIER merge field only gets sent once MAILCHIMP_TIER_MERGE_KEY is set
  // (Settings -> Environment variables), which should happen only after that
  // merge field actually exists on the Mailchimp audience. Sending an
  // unrecognized merge field key would 400 the whole signup, so this stays
  // off by default -- flipping it on is a config change, not a redeploy.
  const tierMergeKey = env.MAILCHIMP_TIER_MERGE_KEY;
  const mergeFields = {};
  if (firstName) mergeFields.FNAME = String(firstName).slice(0, 80);
  if (tierMergeKey && VALID_TIERS.includes(tier)) mergeFields[tierMergeKey] = tier;

  // Upsert first. PUT-by-hash creates new contacts and updates existing ones
  // in the same call, which is what makes this reliable for already-subscribed
  // contacts (the embedded Mailchimp form only tags brand-new signups).
  //
  // Tags are included here too, in the same write as merge_fields, so a
  // tag-triggered welcome automation never fires before FNAME/TIER has landed.
  // The dedicated /tags call right after is kept anyway as the documented,
  // reliable way to trigger "tag added" automations — Mailchimp doesn't
  // consistently fire those off a tags array set via this endpoint alone.
  const upsertRes = await fetch(memberUrl, {
    method: "PUT",
    headers: { Authorization: auth, "content-type": "application/json" },
    body: JSON.stringify({
      email_address: cleanEmail,
      status_if_new: "subscribed",
      ...(Object.keys(mergeFields).length ? { merge_fields: mergeFields } : {}),
      tags: safeTags,
    }),
  });

  if (!upsertRes.ok) {
    const err = await upsertRes.json().catch(() => ({}));
    return json({ ok: false, error: err.detail || "Mailchimp did not accept the signup." }, 500);
  }

  // Tag application is a separate call so it applies every time, regardless
  // of whether the contact was just created or already existed.
  const tagRes = await fetch(`${memberUrl}/tags`, {
    method: "POST",
    headers: { Authorization: auth, "content-type": "application/json" },
    body: JSON.stringify({ tags: safeTags.map((name) => ({ name, status: "active" })) }),
  });

  if (!tagRes.ok) {
    const err = await tagRes.json().catch(() => ({}));
    return json({ ok: false, error: err.detail || "Subscribed, but tagging failed." }, 500);
  }

  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ ok: false, error: "Method not allowed." }, 405);
}
