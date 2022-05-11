import clientPromise from '$lib/db';

let pageSize = 20;

export async function post({ params, locals, url, request }) {
  let { user } = locals;
  let { sheet } = params;
  let { q, page } = await request.json().catch(() => null) || {};
  let queryString = q || '';
  page = page || '0';

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

  let must = [];
  let mustNot = [];
  let filter = [];
  if (sheet.toLowerCase() === '__attention') {
    filter.push({
      range: {
        path: 'aLV',
        gte: 1,
      }
    });
  } else if (sheet.toLowerCase() !== '__all') {
    filter.push({
      text: {
        path: 'sheet',
        query: sheet,
      }
    });
  }

  // Query analysis
  if (queryString.trim().length > 0) {
    let splitted = queryString.trim().match(/\\?.|^$/g).reduce((p, c) => {
      if (c === '"') {
        p.quote ^= 1;
      } else if (!p.quote && c === ' ') {
        p.a.push('');
      } else {
        p.a[p.a.length - 1] += c.replace(/\\(.)/, "$1");
      }
      return p;
    }, { a: [''] }).a;
    splitted = splitted.map(s => s.trim());
    splitted = splitted.filter(s => s.length > 0);
    let hasWildcard = false;
    for (let s of splitted) {
      if (s.includes('*') || s.includes('?')) {
        hasWildcard = true;
        break;
      }
    }
    if (hasWildcard && splitted.length > 1) {
      return {
        status: 400,
        body: "You can only search for one term at a time in wildcard mode.",
      };
    }

    let path = { wildcard: '*' };
    for (const query of splitted) {
      if (query.includes('*') || query.includes('?')) {
        must.push({
          wildcard: {
            path,
            query,
            allowAnalyzedField: true,
          }
        });
        console.log("wildcard", `"${query}"`);
      } else if (query[0] === '-') {
        mustNot.push({
          text: {
            path,
            query: query.substring(1),
          }
        });
        console.log("mustNot", `"${query}"`);
      } else if (query[0] === '/' && query[query.length - 1] === '/') {
        // check if it's a valid regex
        let regexStr = query.substring(1, query.length - 1);
        if (regexStr.length <= 0) {
          return {
            status: 400,
            body: "Invalid regex",
          };
        }
        try {
          new RegExp(regexStr);
        } catch (e) {
          return {
            status: 400,
            body: "Invalid regex: " + query,
          };
        }
        must.push({
          regex: {
            path,
            query: regexStr,
            allowAnalyzedField: true,
          }
        });
        console.log("regex", `/${regexStr}/`);
      } else {
        must.push({
          text: {
            path,
            query,
          }
        });
        console.log("must", `"${query}"`);
      }
    }
  }

  if (filter.length || must.length || mustNot.length) {
    agg.push({
      $search: {
        index: 'default',
        compound: {
          must,
          mustNot,
          filter,
        },
      }
    });
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