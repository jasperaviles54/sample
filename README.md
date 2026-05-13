# Customer Feedback Survey

A simple satisfaction-survey app for businesses with multiple branches and
service windows (e.g. **Registrar**, **Cashier**). Customers tap 😊 or 😞,
add an optional comment, and admins see live dashboards and reports.

- **Frontend:** React (Vite) + React Router + Recharts
- **Auth + Database:** Supabase (Postgres + Row-Level Security)
- **Node.js backend:** Vercel serverless functions in `/api`
- **Deployment:** Vercel

## Project layout

```
sample/
├── api/                       # Node.js serverless functions (Vercel)
│   ├── _supabase.js           # Server-only Supabase client (service role)
│   ├── stats.js               # GET /api/stats — aggregated counts
│   └── export.js              # GET /api/export — CSV download
├── src/
│   ├── components/
│   │   ├── Layout.jsx         # Admin sidebar + outlet
│   │   └── ProtectedRoute.jsx # Redirects to /login if not signed in
│   ├── pages/
│   │   ├── SurveyPage.jsx     # Public 😊/😞 + comments form
│   │   ├── Login.jsx          # Admin sign in
│   │   ├── Dashboard.jsx      # Stats + charts
│   │   ├── Reports.jsx        # Filterable table + CSV export
│   │   ├── ManageBranches.jsx # CRUD business branches
│   │   └── ManageWindows.jsx  # CRUD department windows
│   ├── App.jsx
│   ├── main.jsx
│   ├── supabaseClient.js
│   └── styles.css
├── supabase/
│   └── schema.sql             # Run this once in Supabase SQL Editor
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
└── .gitignore
```

## Routes

| Route                  | Who      | What                                      |
| ---------------------- | -------- | ----------------------------------------- |
| `/survey`              | Public   | 😊/😞 + comments form                     |
| `/login`               | Public   | Admin sign in                             |
| `/admin/dashboard`     | Admin    | Stats cards, bar + pie charts             |
| `/admin/reports`       | Admin    | Filterable table, CSV export              |
| `/admin/branches`      | Admin    | Add/edit/delete branches                  |
| `/admin/windows`       | Admin    | Add/edit/delete department windows        |

## 1. Set up Supabase

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste the contents of
   [supabase/schema.sql](supabase/schema.sql), and run it. This creates the
   `branches`, `department_windows`, `surveys` tables, the `survey_details`
   view, and RLS policies (public can submit surveys; only authenticated
   admins can read responses or manage branches/windows).
3. In **Authentication → Users**, click **Add user → Create new user** and
   create an admin email + password. That account is what you'll use at
   `/login`.
4. In **Project Settings → API**, copy the project URL, the **anon** public
   key, and the **service_role** key (keep the latter secret — never put
   it in client code).

## 2. Local development

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

The app runs at <http://localhost:5173>. The `/api/*` serverless functions
only run when deployed to Vercel — for local testing of those, install the
Vercel CLI and run `vercel dev` instead of `npm run dev`.

### First-run flow

1. Open `/login` and sign in with the admin user you created.
2. Go to **Branches** → add at least one branch (e.g. *Main Branch*).
3. Go to **Department Windows** → add windows under that branch
   (Registrar, Cashier, Information, etc.).
4. Open `/survey` in another tab/device — the branch and window pickers
   should populate. Submit a few responses.
5. Check **Dashboard** and **Reports**.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, click **Add New → Project** and import the repo.
3. Framework preset: **Vite**. Build command and output directory are
   auto-detected (`npm run build` → `dist`).
4. Add the same four environment variables from `.env.example` under
   **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy. Vercel serves the SPA and routes `/api/*` to the Node.js
   functions in `/api` automatically.

## Adding a new department window after launch

Sign in as an admin → **Department Windows** → **+ Add window** → pick the
branch, give it a name (e.g. *Releasing*) and a short code (e.g. *REL*).
It appears in the public survey form immediately — no redeploy needed.

## Data model

```
branches (id, name, code, address)
  └── department_windows (id, branch_id, name, code)
        └── surveys (id, branch_id, window_id, rating, comments, created_at)
```

`rating` is constrained to `'happy'` or `'sad'`. The `survey_details` view
joins all three tables so the dashboard and reports can query in one shot.

## Security notes

- The **anon key** is safe to ship to the browser; RLS policies enforce
  what it can do (read branches/windows, insert surveys, nothing else).
- The **service-role key** is used only by the Node.js serverless
  functions and must stay in Vercel's server-side environment variables.
- Admin actions (manage branches/windows, read survey responses) require
  a signed-in Supabase Auth user.
