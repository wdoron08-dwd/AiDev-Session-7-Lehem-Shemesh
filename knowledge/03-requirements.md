# 03 · Requirements — what the page and the automation must do

Four needs, in the client's own words, each with what it actually implies.

---

## 1. Fast on a phone

> *"שייפתח מהר בטלפון, אנשים מזמינים בערב מהמיטה"*
> Opens fast on a phone — people order in the evening, from bed.

That sentence describes the real user: **one hand, in the dark, in bed, tired, possibly on a
weak connection.** Not someone at a desk comparing bakeries.

**Implications**
- Mobile-first, genuinely — design at 390px and let it grow, don't shrink a desktop layout
- Must work at 390px *and* 1920px, with no horizontal scrolling and no pinch-to-zoom to read
- One image, compressed via Cloudinary `q_auto,f_auto`
- No libraries, no build tools, no web fonts that block the first paint
- Comfortable tap targets and a large-enough form; thumb reach matters more than mouse precision
- Dark, warm, low-glare page is a reasonable choice for a bedtime audience

---

## 2. A form that reaches them

> *"טופס שאנשים ישאירו בו פרטים ומה הם רוצים, ושזה יגיע אלינו"*
> A form where people leave their details and what they want, and it reaches us.

**Fields** (per the task spec): name · phone · email · free text
The free-text field is where the order actually goes — it should invite the order, not sit
there as a generic "message" box. Something like *"מה תרצו, ולאיזו כתובת"*.

**The user must see a result** — an explicit success or error message. Silence after submitting
is the worst possible outcome for someone ordering from bed who will not check back.

**Worth putting near the form**, because the automation cannot enforce them and a wrong order
costs someone their bread:
- order by 20:00 the evening before
- minimum 40 ₪
- delivery streets, so people outside the zone don't order in vain
- payment at the door

---

## 3. Not missing an order

> *"שלא נפספס הזמנה. אם נפספס, מישהו יישאר בלי לחם בבוקר"*
> That we don't miss an order. If we do, someone goes without bread in the morning.

This is the highest-stakes requirement on the page, and it is the reason the automation exists
rather than a `mailto:` link. Three destinations, every submission:

1. **Google Sheets row** — every field plus a timestamp. This is the fulfilment list: they wake
   at 04:00 and bake to it. It must be complete and readable at four in the morning.
2. **Alert email to the owner** — goes to Doron, standing in for them. Clear and readable is
   enough; no design needed.
3. **HTML confirmation email to the customer** — sent to **the address they typed**, pulled
   from the webhook schema. Never a hardcoded address. See the landmine in `CLAUDE.md`.

Redundancy is the point: a missed email still leaves the row in the Sheet.

---

## 4. A link to print and hang in the shop

> *"קישור שנוכל להדפיס ולתלות בחנות"*
> A link we can print and hang in the shop.

The audience is people **already standing in the bakery** who don't know deliveries exist. So:
a short, sayable URL and a QR code, printed and taped to the counter.

**Implications**
- The Vercel URL is what gets printed — keep it clean
- A QR code the client can generate from that URL is the practical form
- Nothing to build on the page for this beyond the URL being stable and public

*(Note: this is a link to the site, not a printable order list. The Google Sheet is the
fulfilment list — see requirement 3.)*

---

## Explicitly out of scope

> *"בלי תשלום מקוון בשלב הזה, משלמים בדלת. ובלי מלאי אונליין, אנחנו לא מנהלים כזה."*

- **No online payment.** Payment at the door. No checkout, no card fields, no payment links.
- **No online inventory.** No stock counts, no "sold out" states, no availability logic.

Both are refusals, not gaps waiting to be filled. Don't build toward them.

---

## Task deliverables checklist

Also tracked in `CLAUDE.md`; repeated here so this file stands alone.

- [ ] One HTML page + separate CSS · no libraries, no build tools
- [ ] AI-generated image on Cloudinary, URL in the code
- [ ] Logo, or the name set nicely as type
- [ ] Form → n8n webhook, with visible success/error
- [ ] Google Sheets row per enquiry, with timestamp
- [ ] Alert email to the owner
- [ ] HTML confirmation email to the enquirer, RTL
- [ ] 5+ commits with meaningful messages
- [ ] Public GitHub repo with history
- [ ] Live Vercel URL ✅ https://ai-dev-session-7-lehem-shemesh.vercel.app
- [ ] CORS locked to that URL, not `*`
- [ ] Change order applied and published
