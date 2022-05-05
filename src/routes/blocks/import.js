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
  }

  const client = await clientPromise;
  const Blocks = client.db().collection(language + '_blocks');
  const Histories = client.db().collection(language + '_histories');

  let sheetAttentionLevel = 0;
  let ids = newBlocks.map(block => block.id).filter(id => id);
  let oldBlocks = await Blocks.find({ sheet, id: { $in: ids } }).toArray().catch(() => { console.error('error'); });
  
  let toUpdate = [];
  if (oldBlocks.length) {
    // we found some old blocks
    for (let oldBlock of oldBlocks) {
      let newBlock = newBlocks.find(block => block.id === oldBlock.id);
      for (const field in newBlock.oStrs) { // they share the same fields
        let oldOValue = oldBlock.oStrs?.[field];
        let newOValue = newBlock.oStrs?.[field];
        let oldTValue = oldBlock.tStrs?.[field];
        let newTValue = newBlock.tStrs?.[field];
        if (oldOValue !== newOValue) {
          // we found a change in original strings
          toUpdate.push({
            id: oldBlock.id,
            field,
            type: "o", // mean original
            oldValue: oldOValue,
            newValue: newOValue,
            lastUpdated: oldBlock.updatedAt,
            setAttentionLevel: oldTValue ? 1 : 2, // if we alreadt has a translation, we set attention level to 1, otherwise to 2
          });
          sheetAttentionLevel = Math.max(sheetAttentionLevel, 1);
          if (oldOValue === null) {
            // this is a new field
            sheetAttentionLevel = Math.max(sheetAttentionLevel, 2);
          }
        }
        if (oldTValue !== newTValue) {
          // we found a change in translated strings
          toUpdate.push({
            id: oldBlock.id,
            field,
            type: "t", // mean translated
            oldTValue,
            newTValue,
            lastUpdated: oldBlock.updatedAt,
          });
          sheetAttentionLevel = Math.max(sheetAttentionLevel, 1);
        }
      }
    }
  }
  
  let toInsert = newBlocks.filter(block => !oldBlocks.find(oldBlock => oldBlock.id === block.id));
  if (toInsert.length) {
    sheetAttentionLevel = Math.max(sheetAttentionLevel, 2);
  }

  if (toInsert.length) {
    for (let block of toInsert) {
      block.updatedAt = new Date();
      block.sheet = sheet;
      block.aLV = 2;
    }
    try {
      await Blocks.insertMany(toInsert);
    } catch (e) {
      console.error(e);
      return {
        status: 500,
      };
    }
  }

  if (toUpdate.length) {
    let updateBulk = Blocks.initializeUnorderedBulkOp();
    let historyToInsert = [];
    for (let update of toUpdate) {
      let { id, field, type, oldValue, newValue, lastUpdated, setAttentionLevel } = update;
      let updateOperation = {
        $set: {
          [type == 'o' ? 'oStrs.' + field : 'tStrs.' + field]: newValue,
          updatedAt: new Date(),
          aLV: setAttentionLevel
        },
      };
      updateBulk.find({ id, sheet }).updateOne(updateOperation);
      historyToInsert.push({
        id,
        sheet,
        field,
        type,
        oldValue,
        updateBy: user._id,
        lastUpdated,
      });
    }
    try {
      await updateBulk.execute();
      await Histories.insertMany(historyToInsert);
    } catch (e) {
      console.error(e);
      return {
        status: 500,
      };
    }
  }

  // update sheet definition attention level
  const Definitions = client.db().collection('definitions');
  let definition = await Definitions.find({ language }).sort({ version: -1 }).limit(1).toArray();
  if (definition.length <= 0) {
    return {
      status: 404,
    };
  }
  definition = definition[0];
  let sheetDefinitionIndex = definition.sheets.findIndex(s => s.name === sheet);
  if (sheetDefinitionIndex < 0) {
    return {
      status: 404,
    };
  }
  try {
    await Definitions.updateOne({ _id: definition._id }, { $max: { [ 'sheets.' + sheetDefinitionIndex + '.attentionLevel' ]: sheetAttentionLevel } });
  } catch (e) {
    console.error(e);
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