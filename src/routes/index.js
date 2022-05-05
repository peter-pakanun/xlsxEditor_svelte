import clientPromise from '$lib/db';

export async function get({ params, locals }) {
  let { user } = locals;
  if (!user) {
    return {
      status: 301,
      headers: {
        Location: '/users/login',
      },
    };
  }

  const client = await clientPromise;
  const Definitions = client.db().collection('definitions');

  let definition = await Definitions.find({ language: user.language }).sort({ version: -1 }).limit(1).toArray();
  if (definition.length <= 0) {
    return {
      body: {}
    };
  }

  return {
    body: {
      definition: definition[0]
    }
  }
}