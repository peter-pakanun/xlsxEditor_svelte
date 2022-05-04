import clientPromise from '$lib/db';

export async function get({ params, locals }) {
  let { version } = params;
  let { user } = locals;
  if (!version || version < 1) {
    return {
      status: 400,
    };
  }
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

  let definition = await Definitions.findOne({ version, language: user.language });
  if (!definition) {
    return {
      status: 404,
    };
  }

  return {
    body: definition,
  };
}