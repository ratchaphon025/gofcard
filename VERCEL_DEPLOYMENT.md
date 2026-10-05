# Vercel deployment

This repository deploys the Vite client and the Express API as one Vercel project.

1. Create a MongoDB Atlas cluster and database user. Add the Vercel deployment IP access rule, or use `0.0.0.0/0` if your Atlas security policy permits it.
2. Create a Vercel Blob store in the Vercel project.
3. Import this repository into Vercel with the repository root as the project root.
4. Add these Vercel environment variables for Production, Preview, and Development:

```text
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
BLOB_READ_WRITE_TOKEN=<token-from-vercel-blob>
CLIENT_URL=https://<your-vercel-domain>
NODE_ENV=production
TOPUP_PROMPTPAY_ID=<shop-promptpay-id>
TOPUP_BANK_NAME=<bank-name>
TOPUP_BANK_ACCOUNT_NAME=<account-holder>
TOPUP_BANK_ACCOUNT_NUMBER=<account-number>
```

The top-up payment details are optional, but customers will need them to send a transfer. Top-ups are manual: customers submit the transfer reference, then an admin verifies the payment and approves or rejects it in Store management. Approval credits the customer's wallet. Wallet balance can be used to pay for an order at checkout; cash on delivery remains available. MongoDB must support transactions for admin approval (MongoDB Atlas clusters do). For local approval, run MongoDB as a replica set and add `?replicaSet=rs0` to `MONGO_URI`; a standalone local MongoDB server does not support this operation.

## Create the first admin account

New registrations receive the `customer` role. To create or restore an admin account, run the seeder from a trusted local machine with `MONGO_URI` pointing to the production Atlas database and `ADMIN_EMAIL` and `ADMIN_PASSWORD` set to the account email and a new private password. `ADMIN_NAME` is optional. Keep these values in the ignored `server/.env` file and never commit or share it. Then run:

```text
npm --prefix server run seed:admin
```

The seeder creates the account or promotes the matching email to admin, activates it, and resets its password to `ADMIN_PASSWORD`. After it completes, sign out of the website and sign in using that email and password. Setting these variables in Vercel alone does not run the seeder.

## Import Booster Boxes and special cards

The Box-pull-only Fusion, Xyz, Synchro, and Pendulum cards are imported into MongoDB by one-off seed commands. Do not add these commands to Vercel's Build Command: they modify the production database and should only be run intentionally.

Install and authenticate the Vercel CLI, link the local repository to the Vercel project if it is not linked yet, then run these commands from the repository root in PowerShell:

```powershell
vercel env pull server/.env --environment=production
npm --prefix server run seed:booster-boxes
npm --prefix server run seed:special-cards
```

`server/.env` is gitignored. The Box seeder adds the related Booster Box entries without overwriting existing prices or stock. The special-card seeder imports 50 cards per summon type, uses card images and card text from the card data source, and converts USD market prices to THB. Review the starter Box prices in `server/src/data/boosterBoxes.seed.js` and update them in the store admin before offering those products for sale.

The admin card image picker sends the file to `/api/uploads`. The API stores the file in Vercel Blob and saves the returned public URL in MongoDB when the card is saved. Files are held in memory only; nothing is written to the Vercel filesystem.

For local development, copy `server/.env.example` to `server/.env`, use a local or Atlas `MONGO_URI`, and run `npm --prefix server run dev` plus `npm --prefix client run dev`.
