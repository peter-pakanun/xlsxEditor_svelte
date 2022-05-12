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
  const Termbase = client.db().collection('Termbase');

  let termbase = await Termbase.find({
    language: user.language,
  }).toArray().catch((e) => { console.error(e); });
  if (!termbase) {
    termbase = [];
  }

  return {
    status: 200,
    body: termbase,
  };
}

export async function post({ locals, request }) {
  let { user } = locals;
  let term = await request.json().catch(() => null) || {};

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

  if (!term || typeof term.source !== 'string' || term.source.trim().length === 0 || typeof term.target !== 'string' || term.target.trim().length === 0) {
    return {
      status: 400,
    };
  }

  term.source = term.source.trim();
  term.target = term.target.trim();
  if (term.source.length > 64 || term.target.length > 64) {
    return {
      status: 400,
      body: "Too long",
    };
  }
  if (term.source.length >= 2 && term.source[0] === '/' && term.source[term.source.length - 1] === '/') {
    // Regex
    let regexStr = term.source.substring(1, term.source.length - 1);
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
        body: "Invalid regex",
      };
    }
  }

  term.weight = parseInt(term.weight, 10);
  if (isNaN(term.weight)) {
    term.weight = 1;
  }
  if (term.weight < 0) {
    term.weight = 0;
  }
  if (term.weight > 100) {
    term.weight = 100;
  }

  const client = await clientPromise;
  const Termbase = client.db().collection('Termbase');

  let termbase = await Termbase.find({
    language: user.language,
    source: term.source,
  }).toArray().catch((e) => { console.error(e); });
  if (termbase && termbase.length > 0) {
    await Termbase.updateOne({
      language: user.language,
      source: term.source,
    }, {
      $set: {
        target: term.target,
        weight: term.weight,
      },
    }).catch((e) => { console.error(e); });
  } else {
    await Termbase.insertOne({
      language: user.language,
      source: term.source,
      target: term.target,
      weight: term.weight,
    }).catch((e) => { console.error(e); });
  }

  return {
    status: 200,
  };
}

