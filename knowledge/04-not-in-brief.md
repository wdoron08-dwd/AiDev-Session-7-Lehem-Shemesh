# 04 · The boundary — what we may invent, and what we may not

**מותר לייצר, אסור להמציא** — generating is allowed, inventing is not.

| Ours to decide | Theirs to state |
|---|---|
| Layout, colours, type, spacing | Years in business, prices, hours |
| The generated image | Delivery days, window, streets |
| The logo / wordmark | Order cutoff, minimum order |
| Section order and wording *of our own copy* | Payment methods |
| Microcopy, labels, button text | Phone, email, address |
| | Anything a customer could act on and be wrong |

The test: **if a customer could show up, pay, or wait based on it, it must come from the
client.** If it only affects how the page looks or feels, it's ours.

---

## Open questions — asked, not answered

Things that came up while building, that the brief does not settle. **Do not put any of these
on the page.** They are here so they get asked, not so they get assumed.

### Q1 · Does "העברה" mean Bit / Paybox?

**Status:** open — Doron's read, not the client's words
**The brief says:** *"משלמים בדלת, מזומן או העברה"* — at the door, cash or transfer.

Doron's reasoning, which is sound: nobody initiates an actual bank wire for a 40 ₪ bread
order — too slow, too fiddly. In practice, an Israeli neighbourhood bakery saying "העברה"
almost certainly means **Bit or Paybox**. No technical setup is involved; it's purely wording
on the page or the order form.

**Why it still stays off the page:** naming Bit or Paybox tells the customer a specific app
will be accepted at the door. If Rami and Iris don't have one, the customer arrives with the
wrong thing at 07:00. The page will say **"מזומן או העברה"** — exactly what the client wrote,
which stays true either way.

**Resolution:** one question to the client — *"'העברה' — ביט? פייבוקס? העברה בנקאית?"* — and
if confirmed, it's a one-word edit.

### Q2 · Is the delivery area only those four streets?

**The brief says:** *"רחובות הרצל, מסדה, החלוץ, ביאליק והסמטאות שביניהם"*
"And the alleys between them" is genuinely vague, and someone one street over will ask.
Write the streets as given, plus the alleys clause. **Do not draw a map or list extra streets.**

*(The change order added רחוב יל״ג on 2026-08-30, after the site was live. It is now in
`01-business.md` and on the page.)*

### Q3 · What happens if someone orders under 40 ₪, or after 20:00?

Not stated. The form cannot enforce it and shouldn't pretend to. State the rules clearly next
to the form and let Rami and Iris handle the edge cases by phone — which is what they do now.

### Q4 · Is delivery free? Is there a fee?

**Never mentioned.** Say nothing. Don't write "משלוח חינם" — it is exactly the kind of
plausible, helpful-sounding sentence that turns into a complaint at the door.

---

## Already caught, don't re-litigate

- **"A printable order list for the shop"** — misreading. *"קישור שנוכל להדפיס ולתלות בחנות"*
  is a link to **the site**, printed and hung so walk-ins learn deliveries exist. The Google
  Sheet is the fulfilment list. Two separate needs; see `03-requirements.md` §3 and §4.

---

## Things that must never appear

Neither client said any of this, and the parallel brief bans it outright:

- Awards, prizes, certifications
- Testimonials, reviews, star ratings, customer quotes
- "Best in Haifa", "award-winning", "famous", "beloved"
- Invented staff, invented history, invented number of customers
- Any product not in the table in `01-business.md`
- Online payment or stock availability — both explicitly refused

---

## How to add to this file

When a detail is needed and the brief doesn't have it, **add a question here instead of
inventing an answer.** Say "the brief doesn't cover this" out loud. A gap that's visible gets
asked about; a gap that's been filled in never does.
