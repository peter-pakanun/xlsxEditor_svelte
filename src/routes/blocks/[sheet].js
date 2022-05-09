import clientPromise from '$lib/db';

let pageSize = 20;

export async function get({ params, locals, url }) {
  let { user } = locals;
  let { sheet } = params;
  let query = url.searchParams?.get('q');
  let page = url.searchParams?.get('page');

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
  if (!sheet) {
    return {
      status: 400,
    };
  }
  if (!page || isNaN(page)) {
    page = 0;
  }

  const client = await clientPromise;
  const Blocks = client.db().collection(user.language + '_blocks');

  let agg = [];
  if (query.trim()) {
    agg.push({
      $search: {
        index: 'default',
        text: {
          query,
          path: {
            wildcard: '*'
          }
        }
      }
    });
  }
  if (sheet.toLowerCase() !== 'all') {
    agg.push({ $match: { sheet } });
  }
  agg.push(...[
    { $sort: { aLV: -1 } }, // https://stackoverflow.com/a/55491963
    { $facet: {
      total: [
        { $count: 'sheet' }
      ],
      pages: [
        { $skip: page * pageSize },
        { $limit: pageSize }
      ],
    }},
  ]);

  let searchResults = await Blocks.aggregate(agg).toArray().catch((e) => { console.error(e); });

  if (!Array.isArray(searchResults)) {
    return {
      status: 500,
    };
  }

  return {
    body: {
      blocks: searchResults[0].pages,
      total: searchResults[0].total[0]?.sheet ?? 0,
      limit: pageSize,
    }
  }
}