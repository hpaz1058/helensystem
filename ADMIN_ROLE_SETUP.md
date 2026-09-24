# Thread & Co. Admin Role Setup

The app now uses the Firestore role in `users/{Firebase UID}` to decide whether an authenticated account can open the admin area.

## First login

1. Sign in with Google or Email/Password.
2. Firebase creates `users/{UID}` automatically if the document does not exist.
3. New accounts receive:
   - `UID`
   - `Name`
   - `Email`
   - `Photo URL`
   - `Provider`
   - `Created date`
   - `createdAt`
   - `role: "user"`

## Make a Google account an admin

In Firebase Console:

`Firestore Database` -> `users` -> the Google user's UID -> `role`

Change:

`user`

to:

`admin`

Save the document, then sign out and sign in again. The account will open `/admin` and will not use the customer pages.

## Important role behavior

Existing users keep their Firestore role. The authentication listener updates profile information without writing `role`, so an existing `admin` role is not reset to `user` on every login.

## Run

```bash
npm install
npm run dev
```

This starts the Vite frontend and Express backend together.
