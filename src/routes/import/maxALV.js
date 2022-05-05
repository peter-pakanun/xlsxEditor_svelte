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

  // find the highest aLV of blocks, group by sheet
  let blocks = await Blocks.aggregate([
    {
      $group: {
        _id: '$sheet',
        aLV: {
          $max: '$aLV'
        },
      }
    }
  ]).toArray().catch(() => { console.error('error'); });

  return {
    status: 200,
    body: blocks
  };
}