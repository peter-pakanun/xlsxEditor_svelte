import clientPromise from '$lib/db';

let pageSize = 20;

export async function get({ params, locals }) {
  let { sheet, page } = params;

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
  const Blocks = client.db().collection(user.language + '_blocks');
  const Histories = client.db().collection(user.language + '_histories');

  let blocks = await Blocks.find({ sheet }).skip(page * pageSize).limit(pageSize).toArray().catch(() => { console.error('error'); });
  if (!blocks || !blocks.length) {
    return {
      status: 404,
    };
  }

  return {
    body: blocks,
  }
}
