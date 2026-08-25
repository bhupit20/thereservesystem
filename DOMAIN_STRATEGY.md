# Domain Strategy — The Reserve System™

## Primary domain

Use `TheReserveSystem.com` as the primary public website and funnel domain.

Recommended production URLs:

- Homepage: `https://thereservesystem.com/`
- Score funnel: `https://thereservesystem.com/quiz/`
- Framework page: `https://thereservesystem.com/pages/framework.html`
- Book page: `https://thereservesystem.com/pages/book.html`

## Legacy / capture domains

Keep both legacy domains. Do not delete or discard them.

### TheLongevityPyramid.com

Purpose: legacy capture asset for readers who saw the earlier pyramid language, book diagrams, or social references.

Recommended redirect:

- `https://thelongevitypyramid.com/*` → `https://thereservesystem.com/quiz/`

Reason: the user intent is likely “take the framework quiz / find my result,” so route directly to The Reserve System Score™.

### ICUReserve.com

Purpose: future ICU-informed reserve concept / possible campaign domain.

Recommended redirect for now:

- `https://icureserve.com/*` → `https://thereservesystem.com/quiz/`

Reason: preserve the asset and convert the curiosity into the score funnel while the brand architecture matures.

## Cloudflare implementation

When Cloudflare Pages is connected:

1. Add `TheReserveSystem.com` as the custom domain for the Pages project.
2. Add `TheLongevityPyramid.com` and `ICUReserve.com` to Cloudflare as separate zones or managed domains.
3. Set bulk redirect rules:
   - `thelongevitypyramid.com/*` → `https://thereservesystem.com/quiz/`
   - `www.thelongevitypyramid.com/*` → `https://thereservesystem.com/quiz/`
   - `icureserve.com/*` → `https://thereservesystem.com/quiz/`
   - `www.icureserve.com/*` → `https://thereservesystem.com/quiz/`
4. Use 301 redirects once final, or 302 redirects during testing.

## Brand architecture rule

The Reserve System™ is the main public-facing framework.

The Longevity Pyramid™ remains useful only as the Chapter 2 orientation/hierarchy diagram:

> In Chapter 2, The Reserve System™ is introduced as a pyramid to show dependency. Later in the book, it becomes a circuit model to show how the body behaves under load.

