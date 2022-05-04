import clientPromise from '$lib/db';

export async function post({ request, locals }) {
  let newBlocks = await request.json().catch(() => null) || {};
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
  if (!newBlocks || !Array.isArray(newBlocks) || newBlocks.length <= 0) {
    return {
      status: 400,
    }
  }
  for (let block of newBlocks) {
    if (!block.name || !block.sheet) {
      return {
        status: 400,
      };
    }
    // TODO: make sure the sheet is valid
    // TODO: make sure block name is a unique index
  }

  const client = await clientPromise;
  const Blocks = client.db().collection(language + '_blocks');
  const Histories = client.db().collection(language + '_histories');

  let names = newBlocks.map(block => block.name).filter(name => name);
  let oldBlocks = await Blocks.find({ name: { $in: names } }).toArray().catch(() => { console.error('error'); });
  let toUpdate = [];
  if (oldBlocks.length) {
    for (let oldBlock of oldBlocks) {
      let newBlock = newBlocks.find(block => block.name === oldBlock.name);
      for (const stringName in newBlock.originalStrings) {
        // we have an edited string
        let oldValue = oldBlock.originalStrings[stringName];
        let newValue = newBlock.originalStrings[stringName];
        if (!oldValue || oldValue !== newValue) {
          toUpdate.push({
            name: oldBlock.name,
            sheet: oldBlock.sheet,
            stringName,
            oldValue,
            newValue,
            lastUpdated: oldBlock.updatedAt,
          });
        }
      }
    }
  }
  let toInsert = newBlocks.filter(block => !oldBlocks.find(oldBlock => oldBlock.name === block.name));

  let promises = [];
  if (toInsert.length) {
    for (let block of toInsert) {
      block.updatedAt = new Date();
    }
    promises.push(Blocks.insertMany(toInsert));
  }

  if (toUpdate.length) {
    let updateBulk = Blocks.initializeUnorderedBulkOp();
    let historyToInsert = [];
    for (let update of toUpdate) {
      let { name, sheet, stringName, oldValue, newValue, lastUpdated } = update;
      let updateOperation = {
        $set: {
          [`originalStrings.${stringName}`]: newValue,
          updatedAt: new Date(),
          hasChanged: true,
        },
      };
      updateBulk.find({ name, sheet }).updateOne(updateOperation);
      historyToInsert.push({
        name,
        sheet,
        stringName,
        oldValue,
        lastUpdated,
      });
    }
    promises.push(updateBulk.execute());
    promises.push(Histories.insertMany(historyToInsert));
  }

  try {
    await Promise.all(promises);
  } catch (err) {
    console.error(err);
    return {
      status: 500,
    };
  }

  return {
    body: {
      updated: toUpdate.length,
      inserted: toInsert.length,
    },
  };
}