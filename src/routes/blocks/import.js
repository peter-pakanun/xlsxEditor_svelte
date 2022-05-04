import clientPromise from '$lib/db';

export async function post({ request, locals }) {
  let { sheet, newBlocks } = await request.json().catch(() => null) || {};
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
  if (!sheet) {
    return {
      status: 400,
    }
  }
  if (!newBlocks || !Array.isArray(newBlocks) || newBlocks.length <= 0) {
    return {
      status: 400,
    }
  }
  for (let block of newBlocks) {
    if (!block.id) {
      return {
        status: 400,
      };
    }
    // TODO: make sure the sheet is valid
    // TODO: make sure block id is a unique index
  }

  const client = await clientPromise;
  const Blocks = client.db().collection(language + '_blocks');
  const Histories = client.db().collection(language + '_histories');

  let ids = newBlocks.map(block => block.id).filter(id => id);
  let oldBlocks = await Blocks.find({ sheet, id: { $in: ids } }).toArray().catch(() => { console.error('error'); });
  let toUpdate = [];
  if (oldBlocks.length) {
    for (let oldBlock of oldBlocks) {
      let newBlock = newBlocks.find(block => block.id === oldBlock.id);
      for (const field in newBlock.oStrs) {
        let oldValue = oldBlock.oStrs[field];
        let newValue = newBlock.oStrs[field];
        if (oldValue !== newValue) {
          //console.log(`"${oldBlock.id}" "${field}" "${oldValue}" !== "${newValue}"`);
          toUpdate.push({
            id: oldBlock.id,
            field,
            type: "o", // mean original
            oldValue,
            newValue,
            lastUpdated: oldBlock.updatedAt,
          });
        }
      }
    }
  }
  let toInsert = newBlocks.filter(block => !oldBlocks.find(oldBlock => oldBlock.id === block.id));

  let promises = [];
  if (toInsert.length) {
    for (let block of toInsert) {
      block.updatedAt = new Date();
      block.sheet = sheet;
    }
    promises.push(Blocks.insertMany(toInsert));
  }

  if (toUpdate.length) {
    let updateBulk = Blocks.initializeUnorderedBulkOp();
    let historyToInsert = [];
    for (let update of toUpdate) {
      let { id, field, oldValue, newValue, lastUpdated } = update;
      let updateOperation = {
        $set: {
          [`oStrs.${field}`]: newValue,
          updatedAt: new Date(),
          hasChanged: true,
        },
      };
      updateBulk.find({ id, sheet }).updateOne(updateOperation);
      historyToInsert.push({
        id,
        sheet,
        field,
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