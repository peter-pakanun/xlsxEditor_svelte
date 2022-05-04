import clientPromise from '$lib/db';

export async function post({ request, locals }) {
  let definition = await request.json().catch(() => null) || {};
  let { user } = locals;

  // validation
  // {
  //   "language": "", // required
  //   "version": 1, // required
  //   "sheets": [
  //     {
  //       "name": "", // required
  //       "fields": [""], // required
  //       "hasTranslationNote": false,
  //     }
  //   ]
  // }
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
  if (!definition || !definition.sheets || !Array.isArray(definition.sheets) || definition.sheets.length <= 0) {
    return {
      status: 400,
    }
  }

  for (let sheet of definition.sheets) {
    if (!sheet.name) {
      return {
        status: 400,
      };
    }
    if (!sheet.fields || !Array.isArray(sheet.fields) || sheet.fields.length <= 0) {
      return {
        status: 400,
      };
    }
    for (let col of sheet.fields) {
      if (typeof col !== 'string') {
        return {
          status: 400,
        };
      }
    }
    sheet.hasTranslationNote = !!sheet.hasTranslationNote;
  }

  const client = await clientPromise;
  const Definitions = client.db().collection('definitions');

  let latestDefinition = await Definitions.find({ language: user.language }).sort({ version: -1 }).limit(1).toArray();
  if (latestDefinition.length <= 0) {
    definition.version = 1;
  } else {
    definition.version = latestDefinition[0].version + 1;
  }

  let result = await Definitions.insertOne(definition);
  if (result.insertedCount <= 0) {
    return {
      status: 500,
    };
  }

  return {
    body: definition,
  };
}