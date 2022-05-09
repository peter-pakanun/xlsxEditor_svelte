import clientPromise from '$lib/db';

let pageSize = 20;

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
  if (!query) {
    return {
      status: 400,
    };
  }
  if (!page || Number.isNaN(page)) {
    page = 0;
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
        aLV: -1,
      }
    },
    {
      $facet: {
        'total': [
          {
            '$count': 'sheet'
          }
        ],
        'pages': [
          {
            '$skip': page * pageSize
          },
          {
            '$limit': pageSize
          }
        ],
      }
    },
  ]).toArray().catch((e) => { console.error(e); });

  if (!Array.isArray(searchResults)) {
    return {
      status: 500,
    };
  }

  return {
    body: {
      pages: searchResults[0].pages,
      total: searchResults[0].total[0].sheet,
    }
  }
}