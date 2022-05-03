import clientPromise from '$lib/db'
import { hash } from 'bcrypt';

export async function post({ locals, request }) {
  const { password } = await request.json().catch(() => null) || {};
  if (!password) {
    return {
      status: 400,
      body: {
        error: 'Please provide a new password'
      }
    };
  }

  if (!locals.user) {
    return {
      status: 401,
      body: {
        error: 'Please login first',
      },
    };
  }

  const client = await clientPromise;
  const Users = client.db().collection('users');

  const user = await Users.findOne({ username: locals.user.username });
  if (!user) {
    return {
      status: 500,
    };
  }

  const newPassword = await hash(password, 10);
  const result = await Users.updateOne(
    { username: locals.user.username },
    { $set: { password: newPassword } },
  ).catch(err => { console.error(err) });
  if (!result) {
    return {
      status: 500,
    };
  }

  return {
    status: 200,
    body: {
      message: 'Password changed successfully',
    },
  };
}