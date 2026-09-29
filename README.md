# Zivion Resident App

## Run Locally

Configure the MongoDB and authentication environment variables described in [DATABASE_SETUP.md](DATABASE_SETUP.md), then start the full-stack development server:

```sh
npm run dev:vercel
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Logins

Use the configured `SEED_DEFAULT_PASSWORD` for newly created demo accounts. If it is not set in local development, the default password is `12345678`. Existing database accounts keep their current passwords when the seed runs again.

| Account | Login email |
| --- | --- |
| Apartment Admin | `admin@royalheights.com` |
| Block A Supervisor | `supervisor.a@royalheights.com` |
| Block B Supervisor | `supervisor.b@royalheights.com` |
| Block C Supervisor | `supervisor.c@royalheights.com` |
| A:402 Homeowner | `homeowner.a402@royalheights.com` |
| A:101 Homeowner | `homeowner.a101@royalheights.com` |
| B:202 Homeowner | `homeowner.b202@royalheights.com` |
| B:301 Homeowner | `homeowner.b301@royalheights.com` |
| C:104 Homeowner | `homeowner.c104@royalheights.com` |
| A:702 Homeowner | `homeowner.a702@royalheights.com` |