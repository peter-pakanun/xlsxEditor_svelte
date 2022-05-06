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

  // get old blocks, if any
  let ids = newBlocks.map(block => block.id).filter(id => id);
  let oldBlocks = await Blocks.find({ sheet, id: { $in: ids } }).toArray().catch(() => { console.error('error'); });
  
  let toUpdate = [];
  if (oldBlocks.length) {
    // we found some old blocks
    for (let oldBlock of oldBlocks) {
      let newBlock = newBlocks.find(block => block.id === oldBlock.id);
      if (newBlock.forceAttentionLevel) sheetAttentionLevel = newBlock.forceAttentionLevel;

      // check every fields
      for (const field in newBlock.oStrs) { // they share the same fields
        let oldOriginal = oldBlock.oStrs?.[field];
        let newOriginal = newBlock.oStrs?.[field];
        let oldTranslation = oldBlock.tStrs?.[field];
        let newTranslation = newBlock.tStrs?.[field];

        if (oldOriginal !== newOriginal) {
          // we found a change in original strings
          toUpdate.push({
            id: oldBlock.id,
            field,
            type: "o",
            oldValue: oldOriginal,
            newValue: newOriginal,
            lastUpdated: oldBlock.updatedAt,
            aLV: newBlock.forceAttentionLevel ?? newTranslation ? 1 : 2, // if we already has a translation, we set attention level to 1, otherwise to 2
          });
          sheetAttentionLevel = newBlock.forceAttentionLevel ?? Math.max(sheetAttentionLevel, 1);
          if (!oldOriginal && !newTranslation) {
            // this is a new field, that has not been translated yet
            sheetAttentionLevel = newBlock.forceAttentionLevel ?? Math.max(sheetAttentionLevel, 2);
          }
        }

        if (oldTranslation !== newTranslation) {
          // we found a change in translated strings
          toUpdate.push({
            id: oldBlock.id,
            field,
            type: "t",
            oldValue: oldTranslation,
            newValue: newTranslation,
            lastUpdated: oldBlock.updatedAt,
          });
        }
      }
    }
  }
  
  let toInsert = newBlocks.filter(block => !oldBlocks.find(oldBlock => oldBlock.id === block.id));
  if (toInsert.length) {
    for (let block of toInsert) { // theses are new blocks only
      block.updatedAt = new Date();
      block.sheet = sheet;

      // only set attention level to 2 if this new block has no translation strings
      // because if we already has a translation, in a *new* block, that mean the file is already translated beforehand
      for (const field in block.oStrs) {
        if (!block.tStrs?.[field]) {
          sheetAttentionLevel = block.forceAttentionLevel ?? Math.max(sheetAttentionLevel, 2);
          block.aLV = 2;
          break;
        }
      }
    }

    // now we can insert new blocks
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
      let { id, field, type, oldValue, newValue, lastUpdated, aLV } = update;
      let updateOperation = {
        $set: {
          [type == 'o' ? 'oStrs.' + field : 'tStrs.' + field]: newValue,
          updatedAt: new Date(),
        },
        $max: {
          aLV,
        }
      };
      updateBulk.find({ id, sheet }).updateOne(updateOperation);
      historyToInsert.push({
        id,
        sheet,
        field,
        type,
        oldValue, // only store old value, we can get the new value from the working collection
        updateBy: user._id,
        lastUpdated,
      });
    }
    try {
      await Promise.all([
        updateBulk.execute(),
        Histories.insertMany(historyToInsert),
      ]);
    } catch (e) {
      console.error(e);
      return {
        status: 500,
      };
    }
  }

  // update sheet definition attention level, but only if there's any change
  if (toUpdate.length || toInsert.length) {
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
  }

  return {
    body: {
      updated: toUpdate.length,
      inserted: toInsert.length,
    },
  };
}