import clientPromise from '$lib/db';

export async function get({ locals }) {
  let { user } = locals;
  if (!user) {
    return {
      status: 401,
    };
  }
  if (!user.language) {
    return {
      status: 403,
    };
  }

  const client = await clientPromise;
  const Definitions = client.db().collection('definitions');

  let definition = await Definitions.find({ language: user.language }).sort({ version: -1 }).limit(1).toArray();
  if (definition.length <= 0) {
    return {
      status: 404,
    };
  }

  return {
    body: definition[0],
  };
}
