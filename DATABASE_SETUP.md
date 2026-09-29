# MongoDB Seed Accounts

The API seeds the complete current demo dataset on its first database-backed request. Existing sample records are preserved, and missing records are added. It also adds any missing demo login accounts without changing passwords for accounts that already exist.

Set these environment variables in `.env.local` for local use and in Vercel Project Settings for deployment:

- `MONGODB_URI`
- `MONGODB_DB=royal_heights`
- `JWT_SECRET` (at least 32 characters)
- `SEED_DEFAULT_PASSWORD` (the initial password assigned to newly seeded demo accounts)

After setting them, start the combined local server with `npm run dev:vercel`, then open `http://localhost:3000`. The first API request creates collections/indexes and seeds the sample flats, visitor requests, guest passes, guards, vehicles, notices, and emergency alerts.

## Seeded Logins

All newly seeded demo accounts use the value of `SEED_DEFAULT_PASSWORD`:

- Admin: `admin@royalheights.com`
- Block A Supervisor: `supervisor.a@royalheights.com`
- Block B Supervisor: `supervisor.b@royalheights.com`
- Block C Supervisor: `supervisor.c@royalheights.com`
- A:402 Homeowner: `homeowner.a402@royalheights.com`
- A:101 Homeowner: `homeowner.a101@royalheights.com`
- B:202 Homeowner: `homeowner.b202@royalheights.com`
- B:301 Homeowner: `homeowner.b301@royalheights.com`
- C:104 Homeowner: `homeowner.c104@royalheights.com`
- A:702 Homeowner: `homeowner.a702@royalheights.com`

Homeowner accounts are generated from `FLATS_DIRECTORY`; adding a flat there adds its matching demo login to the seed roster. Passwords are stored as bcrypt hashes. Changing `SEED_DEFAULT_PASSWORD` does not reset existing account passwords. For production, use a strong password and change seeded/demo credentials before granting access to real residents.

The current directory contains sample apartment data, not a complete real-world resident roster. Replace or extend `FLATS_DIRECTORY` with the actual approved flat records before production seeding.
