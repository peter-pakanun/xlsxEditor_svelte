import clientPromise from '$lib/db';

export async function get({ params, locals, url }) {
  let { page } = params;
  let { user } = locals;
  let query = url.searchParams?.get('q');

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
  const Blocks = client.db().collection(user.language + '_blocks');

  let searchResults = await Blocks.aggregate([
    {
      '$search': {
        'index': 'default',
        'text': {
          query,
          'path': {
            'wildcard': '*'
          }
        }
      }
    },
    {
      '$sort': {
        aLV: -1
      }
    },
    {
      $limit: 20
    },
  ]).toArray().catch(() => { console.error('error'); });

  if (!Array.isArray(searchResults)) {
    return {
      status: 500,
    };
  }

  return {
    body: searchResults,
  }
}