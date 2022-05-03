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

  if (username.length < 3) {
    return {
      status: 400,
      body: {
        error: "Username must be at least 3 characters long"
      }
    };
  }

  if (password.length < 4) {
    return {
      status: 400,
      body: {
        error: "Password must be at least 4 characters long"
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
        username: newUser.username,
        avatar: newUser.avatar,
      },
    },
  };
}