Auth integration notes

Steps to follow locally before pushing:

1. Add environment variables in your local `.env` or Vite env:

VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service role key> (for server)

2. Run the SQL migration: `sql/009_auth.sql` in Supabase SQL editor.

3. Start frontend:

npm install
npm run dev

4. Start backend (in separate terminal):

npm --prefix server install
npm --prefix server run build
npm --prefix server start

Notes:
- The admin endpoints are protected via middleware that validates Supabase JWTs.
- Frontend uses `AuthProvider` to persist sessions and provide access token for requests.

Security:
- Never commit `VITE_SUPABASE_SERVICE_ROLE_KEY` to frontend or public repo.
- Use service role only on the server side for migrations and sensitive operations.
