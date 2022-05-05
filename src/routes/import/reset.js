import clientPromise from '$lib/db';

export async function get({ request, locals }) {
  let { user } = locals;
  let language = user.language;

  if (!user) {
    return {
      status: 401,
    };
  }
  if (!language) {
    return {
      status: 403,
    };
  }

  const client = await clientPromise;
  const Blocks = client.db().collection(language + '_blocks');
  const Histories = client.db().collection(language + '_histories');
  const Definitions = client.db().collection('definitions');

  await Blocks.drop().catch(() => {});
  await Histories.drop().catch(() => {});

  await Definitions.deleteMany({
    language
  }).catch(() => {});

  return {
    status: 200,
  };
}