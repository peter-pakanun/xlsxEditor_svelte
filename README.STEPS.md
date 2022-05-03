# Install Tailwind CSS with SvelteKit

## 1. Create your project
```bash
npm init svelte@next my-app
cd my-app
```

## 2. Install Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init tailwind.config.cjs -p
mv postcss.config.js postcss.config.cjs
```

## 3. Configure your template paths
Add the paths to all of your template files in your `tailwind.config.cjs` file.
```javascript
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {}
    }
  },
  plugins: []
};
```

## 4. Add the Tailwind directives to your CSS
Create a `./src/app.css` file and add the @tailwind directives for each of Tailwind’s layers.
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If you want to add a font, do it here.
```css
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@100;200;300;400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```
And add it to the `tailwind.config.cjs` file
```javascript
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
    }
  },
  plugins: []
};
```

## 5. Import the CSS file
Create a `./src/routes/__layout.svelte` file and import the newly-created `app.css` file.
```svelte
<script>
  import "../app.css";
</script>

<slot />
```

## 6. Start your build process
```bash
npm run dev
```

## 7. Start using Tailwind in your project
Start using Tailwind’s utility classes to style your content.
`index.svelte`
```html
<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>
```

# Authentication
## 1. Setup your database
Install `mongodb`, `bcrypt`, `cookie`, `uuid`, and `dotenv`
```bash
npm install -S mongodb bcrypt cookie uuid dotenv
```

Create a `.env` file and add the following lines:
```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<address>/<database>?retryWrites=true&w=majority"
```
- replace `<username>` with your database's username
- replace `<password>` with your database's password
- replace `<address>` with your database's address
- replace `<database>` with your database name

Create a `/src/lib/db.js` file and add the following lines:
```javascript
import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import { hash } from 'bcrypt';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env');
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (hot module replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
}

// Run this code only once.
if (!global._defaultDbLoaded) {
  global._defaultDbLoaded = true;

  console.log("Loading default data...");
  let client = await clientPromise;
  let Users = client.db().collection('users');
  if (!await Users.findOne({ username: 'user' })) {
    console.log("creating default user account");
    await Users.insertOne({
      username: 'user',
      password: await hash('user', 10),
      avatar: "https://i.pravatar.cc/500?u=user",
      role: 'user',
    });
  }
  if (!await Users.findOne({ username: 'admin' })) {
    console.log("creating default admin account");
    await Users.insertOne({
      username: 'admin',
      password: await hash('admin', 10),
      avatar: "https://i.pravatar.cc/500?u=admin",
      role: 'admin',
    });
  }
  console.log("Loading default data... done");
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
```
* This is a modified version of [Best Practices Connecting from Vercel](https://www.mongodb.com/docs/atlas/best-practices-connecting-from-vercel/#connection-example)

You can use the db from anywhere in your project, for example:
```svelte
// src/routes/users.js
import clientPromise from '$lib/db'

export async function get({ request }) {
  let client = await clientPromise;
  let Users = client.db().collection('users');
  let users = await Users.find({}).toArray();
  return {
    body: {
      users,
    },
  };
}
```

## 2. Create users API
Create a `/src/routes/users/register.js` file and add the following lines:
```javascript
import { serialize } from "cookie";
import { v4 as uuidv4 } from "uuid";
import clientPromise from '$lib/db'
import { hash } from 'bcrypt';

export async function post({ request }) {
  const { username, password } = await request.json().catch(() => null) || {};
  if (!username || !password) {
    return {
      status: 400,
      body: {
        error: "Please provide a username and password"
      }
    };
  }

  const client = await clientPromise;
  const Users = client.db().collection('users');
  const Sessions = client.db().collection('sessions');

  try {
    if (await Users.findOne({ username })) {
      return {
        status: 409,
        body: {
          error: "Username already exists"
        }
      };
    }
  } catch (error) {
    return {
      status: 500
    };
  }

  let newUser = {
    username,
    password: await hash(password, 10),
    avatar: `https://i.pravatar.cc/500?u=${username}`,
  };
  let result = await Users.insertOne(newUser).catch(err => { console.error(err) });
  if (!result) {
    return {
      status: 500
    };
  }
  newUser._id = result.insertedId;

  const session = {
    id: uuidv4(),
    username
  };
  const newSession = await Sessions.insertOne(session).catch(err => { console.error(err) });
  if (!newSession) {
    return {
      status: 500
    };
  }

  return {
    status: 201,
    headers: {
      'Set-Cookie': serialize('session_id', session.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        secure: process.env.NODE_ENV === 'production',
      }),
    },
    body: {
      message: 'User created',
      user: {
        username: newUser.username
      },
    },
  };
}
```

Create a `/src/routes/users/login.js` file and add the following lines:
```javascript
import { serialize } from 'cookie';
import { v4 as uuidv4 } from "uuid";
import clientPromise from '$lib/db'
import { compare } from 'bcrypt';

export async function post({ request }) {
  const { username, password } = await request.json().catch(() => null) || {};
  if (!username || !password) {
    return {
      status: 400,
      body: {
        error: 'Please provide a username and password'
      }
    };
  }

  const client = await clientPromise;
  const Users = client.db().collection('users');
  const Sessions = client.db().collection('sessions');

  const user = await Users.findOne({ username }).catch(err => { console.error(err) });
  if (!user) {
    return {
      status: 401,
      body: {
        error: 'Invalid username or password',
      },
    };
  }

  if (!await compare(password, user.password)) {
    return {
      status: 401,
      body: {
        error: 'Invalid username or password',
      },
    };
  }

  const session = {
    id: uuidv4(),
    username,
  };
  const newSession = await Sessions.insertOne(session).catch(err => { console.error(err) });
  if (!newSession) {
    return {
      status: 500
    };
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': serialize('session_id', session.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1,
        secure: process.env.NODE_ENV === 'production',
      }),
    },
    body: {
      message: 'Successfully signed in',
      user: {
        username: user.username,
        avatar: user.avatar,
      },
    },
  };
}
```

Create a `/src/routes/users/logout.js` file and add the following lines:
```javascript
import { parse, serialize } from 'cookie';
import clientPromise from '$lib/db'

export async function post({ request }) {
  const cookies = parse(request.headers.get('cookie') || '');

  const client = await clientPromise;
  const Sessions = client.db().collection('sessions');

  if (cookies.session_id) {
    await Sessions.deleteOne({ id: cookies.session_id }).catch(err => { console.error(err) });
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': serialize('session_id', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
      }),
    },
    body: {
      message: 'Successfully signed out',
    },
  };
}
```

Create a `/src/hooks.js` file and add the following lines:
```javascript
import { parse } from 'cookie';
import clientPromise from '$lib/db'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const cookies = parse(event.request.headers.get('cookie') || '');

  if (cookies.session_id) {
    const client = await clientPromise;
    const Users = client.db().collection('users');
    const Sessions = client.db().collection('sessions');

    const session = await Sessions.findOne({ id: cookies.session_id }).catch(err => { console.error(err) });
    if (session) {
      event.locals.user = await Users.findOne({ username: session.username }).catch(err => { console.error(err) });
    }
  }

  return resolve(event);
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event) {
  return event.locals?.user
    ? {
      user: {
        username: event.locals.user.username,
        avatar: event.locals.user.avatar,
      }
    }
    : {};
}
```
* This [hooks.js](https://kit.svelte.dev/docs/hooks) file let you access the user object in the `event.locals` object, from both Page and Endpoint components.

Create a `/src/routes/users/me.js` file and add the following lines:
```javascript
export async function get({ locals }) {
  return {
    status: 200,
    body: {
      username: locals.user?.username,
      avatar: locals.user?.avatar,
    }
  };
}
```

## 2. Create users Frontend
We will use some premade components to create a simple user management frontend.
Check them out in the `/src/lib/components` folder.

Create a `/src/routes/users/register.svelte` file and add the following lines:
```svelte
<script>
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	let username = '';
	let password = '';
	let confirmPassword = '';
	let errorMessage;
	let confirmPasswordInputRef;
	let fetching = false;

	async function submit() {
		if (fetching) return;
		fetching = true;

		errorMessage = null;
		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match';
			confirmPasswordInputRef.focus();
			fetching = false;
			return;
		}

		const response = await fetch('', {
			method: 'POST',
			body: JSON.stringify({ username, password }),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});

		let data = await response.json().catch((err) => {
			console.error(err);
			errorMessage = err;
		});

		if (!response.ok) {
			errorMessage = data?.error || 'An unknown error occurred';
			fetching = false;
			return;
		}

		$session.user = data.user;
		goto('/');
	}
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<form on:submit|preventDefault={submit} class="p-4 space-y-5 rounded shadow bg-gray-50">
  <h1>Register</h1>
  <Input
    label="Username"
    id="username"
    name="username"
    type="text"
    placeholder="Username"
    bind:value={username}
    required
    autofocus
  />
  <Input
    label="Password"
    id="password"
    name="password"
    type="password"
    placeholder="Password"
    bind:value={password}
    required
  />
  <Input
    label="Confirm Password"
    id="confirm-password"
    name="confirm-password"
    type="password"
    placeholder="Confirm Password"
    bind:value={confirmPassword}
    bind:inputRef={confirmPasswordInputRef}
    required
  />
  {#if errorMessage}
    <p class="text-sm font-semibold text-red-600">{errorMessage}</p>
  {/if}
  <Button type="submit" disabled={fetching}>Submit</Button>
</form>
```

Create a `/src/routes/users/login.svelte` file and add the following lines:
```svelte
<script>
  import Input from '$lib/components/Input.svelte';
  import Button from '$lib/components/Button.svelte';
	import { goto } from "$app/navigation";
	import { session } from "$app/stores";

  let username = '';
  let password = '';
	let errorMessage;
  let fetching = false;

  async function submit() {
    if (fetching) return;
    fetching = true;

    const response = await fetch("", {
			method: "POST",
			body: JSON.stringify({ username, password }),
			headers: {
				"Content-Type": "application/json",
        "Accept": "application/json",
			}
		});

    let data = await response.json().catch(err => {
			console.error(err);
			errorMessage = err;
    });

		if (!response.ok) {
			errorMessage = data?.error || "An unknown error occurred";
      fetching = false;
			return;
		}

		$session.user = data.user;
		goto("/");
  }
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<form on:submit|preventDefault={submit} class="p-4 space-y-5 rounded shadow bg-gray-50">
  <h1>Login</h1>
  <Input
    label="Username"
    id="username"
    name="username"
    type="text"
    placeholder="Username"
    bind:value={username}
    required
    autofocus
  />
  <Input
    label="Password"
    id="password"
    name="password"
    type="password"
    placeholder="Password"
    bind:value={password}
    required
  />
  {#if errorMessage}
    <p class="text-sm font-semibold text-red-600">{errorMessage}</p>
  {/if}
  <Button type="submit" disabled={fetching}>Submit</Button>
  <Button on:click={() => goto('register')} class="bg-slate-600 hover:bg-slate-700 focus:ring-slate-500">Register</Button>
</form>
```

## 3. Update __layout.svelte
We can now access the session store from any component.
We'll add a basic Navbar to the `__layout.svelte` which will display the user avatar if the user is logged in.
We'll also add an ability to logout here.
```svelte
<script context="module">
  export async function load({ session }) {
    return {
      props: {
        user: session.user || {},
      }
    };
  }
</script>

<script>
  import "../app.css";
	import { goto } from '$app/navigation';
  import { session } from '$app/stores';

  export let user = {};

  let userMenuVisible = false;

  // we need to make it an event so we can modify userMenuVisible
  // Sveltekit won't trigger anchor's event if the href is the same as the current url
  async function myProfile() {
    userMenuVisible = false;
    goto('/users/me');
  }

  async function logout() {
    userMenuVisible = false;
		const response = await fetch('/users/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
        "Accept": "application/json",
			}
		});

    if (response.ok) {
      user = {};
      $session.user = null;
      goto('/');
    }
	}
</script>

<div class="px-6 py-2 text-white bg-indigo-600">
  <nav class="flex items-center justify-between h-16 px-4 mx-auto text-lg max-w-7xl">
    <div class="flex items-center gap-4">
      <a href="/" class="">Home</a>
    </div>
    <div class="flex items-center gap-4">
      {#if user.username}
        <div class="relative inline-block">
          <label for="showUserMenu" class="block w-16 h-16 p-2">
            <img class="object-cover border-2 border-indigo-200 rounded-full cursor-pointer hover:ring-2 place-content-center" src={user?.avatar} alt={user?.username}>
          </label>
          
          <input type="checkbox" id="showUserMenu" name="showUserMenu" class="hidden peer" bind:checked={userMenuVisible}>
          <div class="absolute right-0 z-20 transition origin-top-right -translate-y-5 opacity-0 pointer-events-none peer-checked:pointer-events-auto peer-checked:opacity-100 peer-checked:translate-y-0">
            <ul class="flex-col w-48 py-1 overflow-hidden text-gray-700 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ">
              <li class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" on:click={myProfile}>My Profile</li>
              <li class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" on:click={logout}>Logout</li>
            </ul>
          </div>
          <label for="showUserMenu" class="fixed top-0 left-0 z-10 w-full h-full transition bg-black opacity-0 cursor-pointer pointer-events-none peer-checked:opacity-20 peer-checked:pointer-events-auto"></label>
        </div>
      {:else}
        <a href="/users/login">Sign in</a>
      {/if}
    </div>
  </nav>
</div>

<slot />
```

# Some Basic Layout
We can now add a basic layout to our application.
Start with a big container in main layout.
```html
...
<div class="p-4 mx-auto max-w-7xl">
  <slot />
</div>
```
Change Body color in `app.html`
```html
	<body class="bg-slate-100">
```

# Deploy
We must build the application before deploying.
Before we build, we need to install Sveltekit [node adapter](https://github.com/sveltejs/kit/tree/master/packages/adapter-node)
```bash
npm i -D @sveltejs/adapter-node
```

then add the adapter to your `svelte.config.js`
```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter()
  }
};
```

Now we can build the application.
```bash
npm run build
```

By default the application will be deployed to `/build`.
To start the built application, we can use `node build`
```bash
node build
```