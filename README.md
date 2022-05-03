# Sveltekit with Authentication Boilerplate

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Install dependencies

```bash
npm install
```

## Setup environment variables

Create a `.env` file and add the following lines:
```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<address>/<database>?retryWrites=true&w=majority"
```
- replace `<username>` with your database's username
- replace `<password>` with your database's password
- replace `<address>` with your database's address
- replace `<database>` with your database name

## Developing

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying

By default the application will be deployed to `/build`.
Just run `node build` on your production server.
```bash
node build
```