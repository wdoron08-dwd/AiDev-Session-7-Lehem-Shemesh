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
- Sunday–Friday, 06:30–08:30
- Streets: הרצל, מסדה, החלוץ, ביאליק, יל״ג, and the alleys between them
- Order by 20:00 the evening before
- Minimum order 40 ₪
- Payment at the door — cash or bank transfer

**Other details**
- They wake at 04:00 and bake to the orders received the previous evening
- Shop hours: Sun–Thu 07:00–18:00, Fri 06:00–14:00
- Phone 04-000-0000 · Email lehem@example.co.il

**What they explicitly do NOT want:** no online payment, no online inventory.

**Change order — ✅ applied 2026-08-30.** Hours moved to 06:30–08:30, רחוב יל״ג added.
Changed in `index.html`, `knowledge/01-business.md`, and all three n8n email templates —
the emails state the delivery window, so leaving them would have contradicted the page.

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
**Task complete and submitted.** Both URLs emailed to zohar@focusai.co.il on 2026-08-30.

Everything in the brief is built, live, and verified end to end from a real browser:
the page, the AI image on Cloudinary, the logo, the order form, the n8n automation
(Sheets row + owner alert + branched customer confirmation), CORS locked to the live
origin, and the client's change order applied and auto-published.

Nothing is in flight. If you are picking this up again, it is for polish or for reusing
the patterns — not to finish anything.

LIVE_URL: https://ai-dev-session-7-lehem-shemesh.vercel.app

### 🔑 Live things
| | |
|---|---|
| Site | https://ai-dev-session-7-lehem-shemesh.vercel.app |
| Repo | https://github.com/wdoron08-dwd/AiDev-Session-7-Lehem-Shemesh (public) |
| n8n workflow | `V2iMcf7t8wUSQhCx` · webhook `/webhook/lehem-shemesh-order` |
| Orders sheet | `1_9BUAVANBgMazdThs4gAcVCoILhcDD0e2K2O0s2NFFI`, tab `Orders` |
| Cloudinary | cloud `fxmb2yvw` — `Bakery.jpg` (hero), `Bakery-delivery.jpg` (emails) |

### What is built, and how it was proven
| | |
|---|---|
| One HTML page + separate CSS | No libraries, no build step. 0px horizontal overflow at 390px, measured in a headless browser. |
| Hero image | Cloudinary `q_auto,f_auto` + srcset. 4.0MB original → 61KB WebP on a phone, measured. |
| Logo | Wheat + rising sun, redrawn as SVG from the mark on the bag photo. PNG with alpha for email. |
| Order form | 10 fields, live total, 40₪ minimum showing the exact shortfall, challah disabled unless Friday, Saturdays blocked. |
| 20:00 cutoff | Verified with a faked clock at 18:00 / 19:59 / 20:01 / 23:30 Israel time, from both Asia/Jerusalem and America/New_York. |
| n8n automation | Execution 4417 in `mode: webhook` — real submission from the live site. Sheets row + two distinct Gmail message ids. |
| Branching | Execution 4415 proved the pending path after a real bug was found and fixed (see landmines). |
| CORS | Locked to the exact origin read from `window.location.origin`, not copied from a dashboard. Preflight returns 204. |
| Change order | Live ~1 second after `git push`, Vercel untouched. |

### ⚠️ Known debt
- **The people in the hero photo are AI-generated** and presented as Rami and Iris. The client
  framed all imagery as temporary and to be replaced with real photographs; the faces are the
  sharper edge of that. Logged as a judgment call in `knowledge/04-not-in-brief.md`, not a
  defect — but it is the thing to fix first if this were ever real.
- **Four questions the brief never answered** are recorded in `knowledge/04-not-in-brief.md`
  rather than guessed: what "העברה" means in practice (Bit? Paybox?), how far "the alleys
  between them" reaches, what happens below the 40₪ minimum, and whether delivery costs
  anything. None are on the page.
- The webhook URL is public by necessity — the browser calls it. CORS stops other websites,
  not a direct `curl`. The brief says as much and defers it to a later session.

### 🧨 What this session learned the hard way
Both were **silent failures that reported success** — the expensive kind.
1. Google Sheets with an empty tab invented columns from the raw webhook envelope and wrote
   the whole order into one cell, reporting success. `handlingExtraData: ignoreIt` makes it
   error instead.
2. `$json` is only ever the *previous node's* output. After a Gmail node it is
   `{id, threadId, labelIds}`, so an IF comparing `$json.status` silently fell false and
   **pending orders were sent the "confirmed" email**. Anything downstream of a Gmail node
   must reference `$('Order fields').item.json.*` explicitly.

Neither would have been caught by reading the workflow. Both came from running it and
reading the execution data.
