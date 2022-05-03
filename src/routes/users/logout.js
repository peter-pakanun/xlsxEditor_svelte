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