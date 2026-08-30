# 02 · Visual direction — image and logo

> **This file is the opposite of `01-business.md`.** Everything here is *our* decision. The
> client said so twice, explicitly:
>
> > *"אנחנו אופים, לא מעצבים"* — we bake, we don't design
> > *"ואם לא, השם לבד בסדר גמור"* — and if not, the name on its own is completely fine
>
> So: invent freely here. Invent nothing in `01`.

## The image

**Why they need one, in their words:** *"אנשים קונים לחם בעיניים"* — people buy bread with
their eyes. Their own photos are dark and too small, and a real photoshoot won't happen before
September.

**Explicitly temporary.** *"וכשיהיו לנו תמונות אמיתיות נעביר לכם ונחליף, אנחנו לא רוצים שזה
יישאר ככה לתמיד."* Build the page so swapping the image is a one-line change — a single URL
in one place, not a background baked into three CSS rules.

### Generating it

Generate in ChatGPT or Gemini, download, upload to **Cloudinary**.

A good prompt names **the material, the light, and the angle** — not just the object. Weak:
"a loaf of bread". Better: the crust, the crumb, where the light comes from, how close the
camera sits.

Suggested direction — a real, imperfect loaf, not a stock-photo one:

> A rustic round sourdough loaf on a worn wooden board, deeply scored crust with flour still
> dusted on top, shot from a low three-quarter angle, warm morning window light raking across
> from the left, soft shadows, shallow depth of field, muted natural colours, no text, no hands,
> no packaging.

Aim for what a small bakery would actually photograph on a good morning — slightly rough, warm,
early. Avoid: glossy studio lighting, perfect symmetry, food-magazine styling, visible text
(AI text renders as gibberish), anything that reads as a stock photo.

### Serving it

Deliver through Cloudinary with **`q_auto,f_auto`** in the URL — automatic compression and
per-browser format. This is not optional polish: the client's stated priority is that the page
opens fast on a phone, and a full-weight image is slowest for exactly the people they most want
to reach.

```
https://res.cloudinary.com/<cloud>/image/upload/q_auto,f_auto,w_1200/<id>.jpg
```

Same URL can be reused inside the HTML confirmation email.

## The logo

**What they have:** nothing. A wooden sign a carpenter friend made years ago, in the shop.
**What they asked for:** *"אם אפשר לעשות משהו קטן שנוכל לשים בדף, ואולי בעתיד גם על שקיות"* —
something small for the page, maybe later for bags. **And:** the name alone is fine.

That last clause matters. A well-set wordmark satisfies the brief and satisfies the task
requirement (*"שם מעצב יפה נחשב"* — a nicely set name counts).

**Design implication of "maybe on bags":** it should survive being printed in one colour on
brown paper. So — simple shape, strong silhouette, no gradients, no fine detail, works at
24px and at 200px. If in doubt, set the name well and stop.

**Name meaning:** לחם ושמש = *bread and sun*. Sun + morning + the 04:00 bake is a coherent
thread; the delivery window is literally sunrise. Available without cliché: a sun that reads
as a round loaf, a horizon line, a simple rising-sun arc. Avoid wheat sheaves and chef hats.

**Palette direction:** warm and low-contrast — crust browns, flour cream, a warm morning
yellow as the single accent. Enough contrast for body text to stay accessible; the warmth
belongs in the large areas, not in the small type.

## Guardrail

Design is ours; facts are not. No invented awards, no testimonials, no "best bakery in Haifa".
They said plainly they have none, and the parallel brief for another client spells it out:
*"אל תכתבו שאני הכי טוב בארץ... אין לי פרסים ואין לי המלצות כתובות, אז אל תמציאו."*
