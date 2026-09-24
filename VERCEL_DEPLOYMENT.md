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
```

The admin card image picker sends the file to `/api/uploads`. The API stores the file in Vercel Blob and saves the returned public URL in MongoDB when the card is saved. Files are held in memory only; nothing is written to the Vercel filesystem.

For local development, copy `server/.env.example` to `server/.env`, use a local or Atlas `MONGO_URI`, and run `npm --prefix server run dev` plus `npm --prefix client run dev`.