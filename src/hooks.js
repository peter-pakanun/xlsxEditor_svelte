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
        language: event.locals.user.language,
        avatar: event.locals.user.avatar,
      }
    }
    : {};
}