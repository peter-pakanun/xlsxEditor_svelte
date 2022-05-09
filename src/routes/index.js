import clientPromise from '$lib/db';

export async function get({ params, locals }) {
  let { user } = locals;
  if (!user) {
    return {
      status: 302,
      headers: {
        Location: '/users/login',
      },
    };
  }
  if (!user.language) {
    return {
      status: 302,
      headers: {
        Location: '/users/wait',
      },
    };
  }

  const client = await clientPromise;
  const Definitions = client.db().collection('definitions');

  let definitions = await Definitions.find({ language: user.language }).sort({ version: -1 }).limit(1).toArray();
  if (definitions.length <= 0) {
    return {
      status: 302,
      headers: {
        Location: '/import',
      },
    };
  }

  return {
    body: {
      definition: definitions[0]
    }
  }
}