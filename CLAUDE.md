# CLAUDE.md — לחם ושמש (AI DEV, מפגש 7)

## 🧭 Identity & Role

You are pair programmer for Doron's Session 7 class task: build a one-page site for a
real-seeming client, wire it to an n8n automation, and get it live on a public URL.

**Objective:** one HTML page + separate CSS, an AI-generated image on Cloudinary, a contact
form that reaches an n8n webhook, deployed on Vercel from a public GitHub repo.

**Stack:** plain HTML + CSS (no libraries, no build tools). n8n · Google Sheets · Cloudinary ·
GitHub · Vercel.

**The client:** לחם ושמש — a small sourdough bakery in Hadar, Haifa, run by Rami & Iris.

---

## 🛑 Standing Rules

### 1. Approval gate
Doron is doing this task step by step, deliberately. **Discuss and plan before editing.**
Wait for an explicit GO. One GO = one step. Reading, searching and measuring need no GO.

### 2. Commit after every meaningful change
The task requires **at least 5 commits** with messages that say what was done. One big commit
at the end fails the requirement, and it cannot be fixed retroactively. Commit as you go.

### 3. Push, don't just commit
Vercel deploys from GitHub, not from this Mac. A commit that was never pushed will never
reach the live site. Every commit gets pushed.

### 4. מותר לייצר, אסור להמציא — generate freely, invent nothing
Images, logo, colours and layout are **our** call; the client said so explicitly.
Facts — years, prices, hours, streets, phone — come **only** from the client email below.
Anything not written there does not exist. No awards, no testimonials, no "best in the city".

---

## 📁 Knowledge files — read before building

| File | Read it when |
|---|---|
| `knowledge/01-business.md` | You need a fact. **The only permitted source.** |
| `knowledge/02-visual.md` | Image prompt, logo direction, palette. Ours to invent. |
| `knowledge/03-requirements.md` | What the page and automation must do, and why |
| `knowledge/04-not-in-brief.md` | **Before writing any detail you're unsure about.** Open questions and the invent/don't-invent line. |

---

## 📇 Client facts — summary (full version in `knowledge/01-business.md`)

Rami & Iris · לחם ושמש · Hadar, Haifa · operating since 2019.
Sourdough bread and pastries, everything baked the same morning.

**Products**
| Item | Price |
|---|---|
| לחם כפרי מחמצת | 32 ₪ |
| לחם שיפון | 36 ₪ |
| חלה (ימי שישי בלבד) | 28 ₪ |
| בורקס גבינה (ליחידה) | 12 ₪ |

**Deliveries — the new thing**
- Start: 1 September
- Sunday–Friday, 07:00–09:00
- Streets: הרצל, מסדה, החלוץ, ביאליק, and the alleys between them
- Order by 20:00 the evening before
- Minimum order 40 ₪
- Payment at the door — cash or bank transfer

**Other details**
- They wake at 04:00 and bake to the orders received the previous evening
- Shop hours: Sun–Thu 07:00–18:00, Fri 06:00–14:00
- Phone 04-000-0000 · Email lehem@example.co.il

**What they explicitly do NOT want:** no online payment, no online inventory.

**Change order — apply only after the site is live and working:**
1. Delivery hours move to 06:30–08:30 (from 07:00–09:00)
2. Add רחוב יל״ג to the delivery streets
Then: edit → commit → push. **Do not touch Vercel** — it redeploys itself in under a minute.

---

## ✅ Deliverables

- [ ] One HTML page + separate CSS. No libraries, no build tools.
- [ ] AI-generated image hosted on Cloudinary, URL embedded in the code
- [ ] Logo, or the business name set nicely as type
- [ ] Form → n8n webhook: name, phone, email, free-text. User sees success or error.
- [ ] Every enquiry saved as a row in Google Sheets, with a timestamp
- [ ] Alert email to the business owner → goes to Doron
- [ ] Confirmation email to the enquirer, HTML-designed → goes to the address they typed
- [ ] At least 5 commits with meaningful messages
- [ ] Public GitHub repo with full history
- [ ] Live Vercel URL, opens on any device
- [ ] CORS locked to the real site URL, not `*`
- [ ] Change order applied and published

**Submit:** live URL + repo URL, emailed to zohar@focusai.co.il

---

## 🧨 Landmines — each one already bit someone

- **CORS is matched character for character.** `https://site.vercel.app` is right.
  Missing `https://` is wrong; a trailing `/` is wrong. Both fail *silently* — no error
  message anywhere. Vercel's dashboard shows the URL without `https://`, and copying from the
  browser bar adds the slash. Both traps are copy-paste artifacts.
- **Form fails and n8n shows nothing?** The request never left the browser. That's CORS.
  Check the browser console for a message naming it.
- **Never ask Claude Code to deploy to Vercel.** The CLI asks interactive questions and waits
  for a keyboard that isn't attached — it hangs. Deploy from the dashboard: Add New → Import.
  Git, GitHub, commits and pushes are all fine for Claude Code to do.
- **A new repo does not appear in Vercel by itself.** Every project needs its own Import.
- **Filename case matters on Vercel, not on your Mac.** `Style.css` vs `style.css` — the page
  looks perfect locally and deploys with no styling at all. First thing to check if the design
  vanishes after deploy.
- **Image weight.** The client asked for a page that opens fast on a phone. Use Cloudinary's
  `q_auto` and `f_auto` URL parameters.
- **The confirmation email's recipient is dynamic.** It must reference the email field from the
  webhook's schema, not a typed-in address. Test: fill the form with your own email and you
  should get **two different** emails. One email, or two identical ones, means it's hardcoded.
- **Email design is not web design.** Mail clients support far less than browsers. Ask for
  markup written for email, and set direction RTL.
- **`$json` is only ever the previous node's output.** After a Gmail node, `$json` is
  `{id, threadId, labelIds}` — the order data is gone. An IF comparing `$json.status` there
  silently evaluates false and every order takes the wrong branch, with no error. Anything
  downstream of a Gmail node must reference `$('Order fields').item.json.*` explicitly.
  This shipped once: pending orders received the "confirmed" email.
- **Google Sheets with no header row invents its own.** With `handlingExtraData` left at its
  default, an empty tab got columns named `headers, params, query, body` and the whole order
  dumped into one cell — reported as success. Set it to `ignoreIt`, which errors instead.
- **CORS is set to `*` only during development.** Step 7 replaces it with the real URL. After
  that, submitting from the local file is *supposed* to fail. That is correct, not broken.

---

## 🔧 Commands

```bash
./status.sh    # cold-start state probe — run this first, every session
```

There is no test suite. Nothing here is verified automatically — the checks that matter are
done by hand on a phone, against the live URL.

---

## 🏁 Session Snapshot — updated 2026-08-30

> Current state only. Rewrite this at every warm close; never append.
> If this disagrees with git, git wins — and fix this block.

### ▶️ START HERE
**The whole chain works end to end, verified from the live site in a real browser.**
Form → n8n webhook → Google Sheets row → owner alert → branched customer confirmation.
CORS is locked to the live origin. The workflow is active and published.

Remaining: test on a real phone, then apply the change order (delivery hours to 06:30–08:30,
add רחוב יל״ג), push, and confirm Vercel republishes on its own.

Doron is working through the task step by step and wants to be consulted before each step.

LIVE_URL: https://ai-dev-session-7-lehem-shemesh.vercel.app

### 📌 Next, in order
1. Test on a real phone — the page and the confirmation email. Fix, commit, push each fix.
2. Apply the change order: delivery hours 07:00–09:00 → 06:30–08:30, add רחוב יל״ג to the
   streets. Edit, commit, push. **Do not touch Vercel** — it republishes itself.
3. Send the two URLs to zohar@focusai.co.il

Done: ~~page~~ ~~image~~ ~~logo~~ ~~n8n workflow~~ ~~Vercel~~ ~~CORS locked~~

### ⚠️ Known debt
- The bakery photos are AI-generated, including the two people presented as Rami and Iris.
  The client framed the images as temporary and to be swapped for real photos; the faces are
  the sharper version of that question. See `knowledge/04-not-in-brief.md`.
- The Sheet holds test rows from development. Clear them before handing it over.

### 🔑 Live things
- Site: https://ai-dev-session-7-lehem-shemesh.vercel.app
- Repo: https://github.com/wdoron08-dwd/AiDev-Session-7-Lehem-Shemesh
- n8n workflow `V2iMcf7t8wUSQhCx` · webhook `/webhook/lehem-shemesh-order`
- Orders sheet `1_9BUAVANBgMazdThs4gAcVCoILhcDD0e2K2O0s2NFFI`, tab `Orders`
