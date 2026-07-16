# ACCESS — Digital Literacy Checkpoints

A quiz platform for online learners. A facilitator creates topics and schedules
them with open/close windows; learners take only the quizzes that are currently
open, see their score in real time, and keep a "boarding pass" of results after a
window closes (the quiz itself locks once closed, but the score stays visible).

This is the **self-hosted version** for Vercel. It stores data in a small
key-value database (Upstash Redis) through one serverless function, so the
facilitator's quizzes are shared with every learner while each learner's own
results stay on their device.

---

## What's in here

```
index.html        The whole app (front-end)
api/storage.js    Serverless function: reads/writes the database
package.json      Declares the one dependency (@upstash/redis)
.gitignore
README.md         This file
```

---

## Deploy in ~10 minutes

You'll do three things: put the code on GitHub, create a free database, and
connect it to Vercel.

### 1. Put the code on GitHub

1. Create a new **empty** repository on GitHub (e.g. `access-quiz`).
2. Upload these files to it (drag-and-drop in the GitHub web UI works, or use
   `git`). Keep the folder structure — `api/storage.js` must stay inside an
   `api` folder.

### 2. Create a free Redis database (Upstash)

1. Go to **https://upstash.com** and sign up (free).
2. Create a **Redis** database (any region close to your learners; the free tier
   is enough).
3. On the database page, open the **REST API** section and copy these two values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Deploy on Vercel

1. Go to **https://vercel.com** and sign up (free), then **Add New → Project**.
2. **Import** the GitHub repo you created.
3. Before clicking Deploy, open **Environment Variables** and add the two values
   from Upstash:

   | Name | Value |
   |------|-------|
   | `UPSTASH_REDIS_REST_URL` | *(paste from Upstash)* |
   | `UPSTASH_REDIS_REST_TOKEN` | *(paste from Upstash)* |

4. Click **Deploy**. When it finishes, Vercel gives you a public URL like
   `https://access-quiz.vercel.app`.

That URL is what you share with learners. The first time anyone opens it, the app
seeds the starter topics automatically (including the 50-question Microsoft Word
Basics quiz).

> **Tip — even simpler database setup:** In the Vercel dashboard you can instead
> go to **Storage → Create Database → Upstash (Redis)**. Vercel then adds the
> connection variables to your project for you, and this function picks them up
> automatically (it also accepts the `KV_REST_API_URL` / `KV_REST_API_TOKEN`
> names Vercel uses).

---

## Facilitator access

- On the public site, learners only ever see the learner view.
- Click **Facilitator login** (top-right) and enter the passcode to manage
  topics and assignments.
- The default passcode is **`checkpoint2026`**.

**Change the passcode** before sharing: open `index.html`, find the line

```js
const FACILITATOR_PASSCODE = 'checkpoint2026';
```

and set your own value, then re-deploy (pushing to GitHub redeploys automatically).

---

## How the data is organized

- **Shared data** (topics, assignments) is global — every learner sees the same
  scheduled quizzes.
- **Personal data** (a learner's name, scores, and the facilitator login) is tied
  to the individual browser via a random id kept in that browser's local storage.
  A learner who switches devices or clears their browser starts fresh.

---

## Security note (please read)

This version keeps the same convenience-first design as the original:

- The facilitator passcode lives in `index.html`, so anyone who views the page
  source can read it. It keeps casual learners out of the admin view, but it is
  **not** strong security.
- The storage function does not itself require the passcode, so a determined
  person who inspected the site could write data directly.

For a classroom / cohort tool this is usually fine. If you later need real
protection (e.g. this becomes an official, wide-audience assessment), the right
upgrade is to move the passcode check to the server and require it for any change
to shared data. That's a focused follow-up we can do when you need it.

---

## Local preview (optional)

You can open `index.html` directly in a browser to see the layout, but saving and
loading won't work without the serverless function. To run the whole thing
locally, install the Vercel CLI and run `vercel dev` from this folder (you'll
still need the two Upstash environment variables in a local `.env` file).
