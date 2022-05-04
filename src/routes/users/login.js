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
        language: user.language,
        avatar: user.avatar,
      },
    },
  };
}