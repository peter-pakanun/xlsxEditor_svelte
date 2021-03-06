import clientPromise from '$lib/db';
import { ObjectId } from 'mongodb';

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

  let { ok, term: validatedTerm } = validateTerm(term);
  if (!ok) {
    return {
      status: 400,
      body: {
        message: validatedTerm.message,
      },
    };
  }

  const client = await clientPromise;
  const Termbase = client.db().collection('Termbase');

  let termbase = await Termbase.find({
    language: user.language,
    source: validatedTerm.source,
  }).toArray().catch((e) => { console.error(e); });
  if (termbase && termbase.length > 0) {
    return {
      status: 400,
      body: {
        message: 'Term already exists',
      },
    };
  }

  await Termbase.insertOne({
    language: user.language,
    source: validatedTerm.source,
    target: validatedTerm.target,
    weight: validatedTerm.weight,
  }).catch((e) => { console.error(e); });
  
  return {
    status: 200,
  };
}

export async function put({ locals, request }) {
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

  let { ok, term: validatedTerm } = validateTerm(term);
  if (!ok) {
    return {
      status: 400,
      body: {
        message: validatedTerm.message,
      },
    };
  }

  const client = await clientPromise;
  const Termbase = client.db().collection('Termbase');

  // check for source conflict
  let oldTerm = await Termbase.find({
    language: user.language,
    source: validatedTerm.source,
  }).toArray().catch((e) => { console.error(e); });
  if (oldTerm && oldTerm.length > 0 && oldTerm[0]._id.toString() !== validatedTerm._id) {
    return {
      status: 409,
      body: {
        message: 'This source is already used',
      },
    };
  }

  let result = await Termbase.updateOne({
    language: user.language,
    _id: ObjectId(validatedTerm._id),
  }, {
    $set: {
      source: validatedTerm.source,
      target: validatedTerm.target,
      weight: validatedTerm.weight,
    },
  }).catch((e) => { console.error(e); });

  if (!result.matchedCount) {
    return {
      status: 400,
      body: {
        message: 'Term does not exist',
      },
    };
  }

  return {
    status: 200,
  }
}

export async function del({ locals, request }) {
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

  if (!term._id || !ObjectId.isValid(term._id)) {
    return {
      status: 400,
      body: {
        message: 'Invalid term id',
      },
    };
  }

  const client = await clientPromise;
  const Termbase = client.db().collection('Termbase');

  let result = await Termbase.deleteOne({
    language: user.language,
    _id: ObjectId(term._id),
  }).catch((e) => { console.error(e); });

  if (!result.deletedCount) {
    return {
      status: 400,
      body: {
        message: 'Term does not exist',
      },
    };
  }

  return {
    status: 200,
  }
}

function validateTerm(term) {
  if (!term || typeof term.source !== 'string' || term.source.trim().length === 0 || typeof term.target !== 'string' || term.target.trim().length === 0) {
    return {
      ok: false,
      message: 'Invalid term',
    }
  }

  if (term._id && !ObjectId.isValid(term._id)) {
    return {
      ok: false,
      message: 'Invalid term',
    }
  }

  term.source = term.source.trim();
  term.target = term.target.trim();
  if (term.source.length > 64 || term.target.length > 64) {
    return {
      ok: false,
      message: "Too long",
    };
  }
  if (term.source.length >= 2 && term.source[0] === '/' && term.source[term.source.length - 1] === '/') {
    // Regex
    let regexStr = term.source.substring(1, term.source.length - 1);
    if (regexStr.length <= 0) {
      return {
        ok: false,
        message: "Invalid regex",
      };
    }
    try {
      new RegExp(regexStr);
    } catch (e) {
      return {
        ok: false,
        message: "Invalid regex",
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

  return {
    ok: true,
    term,
  };
}