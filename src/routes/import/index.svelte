<script context="module">
	export async function load({ session }) {
		if (!session?.user) {
			return {
				status: 302,
				redirect: '/users/login?redirect=%2Fimport'
			};
		}

		let definition = await fetch('/definitions/latest')
			.then((r) => r.json())
			.catch(() => null);

		return {
			props: {
				user: session.user,
				lastDefinition: definition
			}
		};
	}
</script>

<script>
	import { read, utils } from 'xlsx';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import FileInput from '$lib/components/FileInput.svelte';
  import Logger from '$lib/components/Logger.svelte';

	export let user;
	export let lastDefinition;

  let logger;
	let files;
	let workbook;
  let definition = {
    language: user.language,
    sheets: []
  };

  let updatedSheets = [];
  let newSheets = [];
  let removedSheets = [];

	async function handleFileChange() {
		if (!files.length) return;
    logger.log('Reading file, please wait...');
		workbook = await read(await files[0].arrayBuffer(), { type: 'array' });
    if (!workbook.SheetNames) {
      logger.log('No sheets found in file.');
      return;
    }
		console.log(workbook);

    logger.log('Sheets loaded!');
    logger.log('Comparing definitions...');
		definition = {
			language: user.language,
			sheets: []
		};

    updatedSheets = [];
    newSheets = [];
    removedSheets = [];
    for (let sheetname of workbook.SheetNames) {
      let sheet = workbook.Sheets[sheetname];
      let sheetDefinition = {
        name: sheetname,
        fields: [],
        hasTranslationNote: false,
      };

      // check if Cell A1 is "ID" or not
      if (sheet['A1']?.v !== 'ID') {
        logger.log(`Sheet '${sheetname}' has no ID column, abort!`);
        return;
      }
      
      let range = utils.decode_range(sheet['!ref']);
      let colCount = range.e.c - range.s.c + 1;

      // Header will be sequence of: ID, Field1, Translation, [Null, Field2, Translation], ...
      // Sheet that has translation note will have it between ID and Original
      // Which mean if colCount is divisible by 3, it has no translation note
      // But if the modulo is 1, it has translation note
      if (colCount % 3 === 0) {
        sheetDefinition.hasTranslationNote = false;
      } else if (colCount % 3 === 1) {
        sheetDefinition.hasTranslationNote = true;
      } else {
        logger.log(`Sheet '${sheetname}' has invalid column count, abort!`);
        return;
      }

      // Get all fields
      for (let c = sheetDefinition.hasTranslationNote ? 2 : 1; c < colCount; c += 3) {
        let fieldCell = utils.encode_cell({ c, r: 0 });
        let field = sheet[fieldCell]?.v;
        if (!field) {
          logger.log(`Sheet '${sheetname}' has no field at column ${c}, abort!`);
          return;
        }
        let translationCell = utils.encode_cell({ c: c + 1, r: 0 });
        let translation = sheet[translationCell]?.v;
        if (translation !== 'Translation') {
          logger.log(`Sheet '${sheetname}' has no translation at column ${c + 1}, abort!`);
          return;
        }
        // if this is a second or later iteration, check preceding field if it's undefined
        if (c > 2 && sheet[utils.encode_cell({ c: c - 1, r: 0 })]?.v !== undefined) {
          logger.log(`Sheet '${sheetname}' has no null field at column ${c - 1}, abort!`);
          return;
        }
        
        // check if field contains weird characters
        if (field.match(/[^a-zA-Z0-9_ ]/)) {
          logger.log(`Sheet '${sheetname}' has invalid field '${field}' at column ${c}, abort!`);
          return;
        }
        sheetDefinition.fields.push(field);
      }

      // compare with last definition
      let oldSheet = lastDefinition?.sheets?.find((s) => s.name === sheetname);
      let newSheet = sheetDefinition;
      let oldFields = [];
      let newFields = [];
      let hasUpdate = false;
      if (oldSheet) {
        // check oldSheet's fields
        for (let i = 0; i < oldSheet.fields.length; i++) {
          let fieldObj = {
            name: oldSheet.fields[i],
          };
          let newI = sheetDefinition.fields.indexOf(oldSheet.fields[i]);
          if (newI === -1) {
            logger.log(`Sheet '${sheetname}' -> '${oldSheet.fields[i]}' got removed`);
            fieldObj.removed = true;
            hasUpdate = true;
          } else if (sheetDefinition.fields[newI] !== oldSheet.fields[i]) {
            hasUpdate = true; // maybe the field index changed?
          }
          oldFields.push(fieldObj);
        }
        // check newSheet's fields
        for (let i = 0; i < newSheet.fields.length; i++) {
          let fieldObj = {
            name: newSheet.fields[i],
          };
          let oldI = oldSheet.fields.indexOf(newSheet.fields[i]);
          if (oldI === -1) {
            logger.log(`Sheet '${sheetname}' -> '${newSheet.fields[i]}' got added`);
            fieldObj.added = true;
            hasUpdate = true;
          } else if (oldSheet.fields[oldI] !== newSheet.fields[i]) {
            hasUpdate = true; // maybe the field index changed?
          }
          newFields.push(fieldObj);
        }
      } else {
        logger.log(`Found new Sheet: '${sheetname}'`);
        newSheets.push(sheetDefinition);
      }
      if (hasUpdate) {
        updatedSheets.push({
          name: sheetname,
          oldFields,
          newFields,
        });
      }

      definition.sheets.push(sheetDefinition);
    }

    updatedSheets = updatedSheets;
    newSheets = newSheets;

    // find removed sheets
    if (lastDefinition) {
      for (let oldSheet of lastDefinition.sheets) {
        let newSheet = definition.sheets.find((s) => s.name === oldSheet.name);
        if (!newSheet) {
          logger.log(`Sheet '${oldSheet.name}' got removed!`);
          removedSheets.push(oldSheet);
        }
      }
    }
    removedSheets = removedSheets;

    logger.log('Definition loaded!');
    console.log(definition);
	}

  let uploadingDefinition = false;
  async function uploadDefinition() {
    if (uploadingDefinition) return;
    uploadingDefinition = true;

    logger.log('Uploading definition, please wait...');
    let response = await fetch('/definitions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(definition)
    });
    if (response.status === 200) {
      logger.log('Definition uploaded!');
      lastDefinition = definition;
      updatedSheets = [];
      newSheets = [];
      removedSheets = [];
    } else {
      logger.log('Definition upload failed!');
    }
    uploadingDefinition = false;
  }

  let importingData = false;
  let importedCount = 0;
  let blockUpdated = 0;
  let blockInserted = 0;
  let importFinished = false;
  async function beginImport() {
    if (importingData) return;
    importingData = true;
    importedCount = 0;

    logger.log('Importing data, please wait... (this may take a while)');
    let sheetCount = definition.sheets.length;
    let sheetIndex = 0;
    for (let sheetDefinition of definition.sheets) {
      let { name, fields, hasTranslationNote } = sheetDefinition;
      let worksheet = workbook.Sheets[name];
      let range = utils.decode_range(worksheet['!ref']);
      let blocks = [];
      sheetIndex++;

      for (let r = 1; r <= range.e.r; r++) {
        let id = worksheet[utils.encode_cell({ c: 0, r })]?.v;
        if (!id) continue;
        let block = {
          id,
          tlNote: hasTranslationNote ? worksheet[utils.encode_cell({ c: 1, r })]?.v : undefined,
          oStrs: {},
          tStrs: {},
        };
        for (let c = 0; c < fields.length; c++) {
          let field = fields[c];
          let oCellCol = c * 3 + (hasTranslationNote ? 2 : 1);
          let oCell = utils.encode_cell({
            r: r,
            c: oCellCol
          });
          let oValue = worksheet[oCell]?.v;
          if (oValue) block.oStrs[field] = oValue;
          let tCellCol = oCellCol + 1;
          let tCell = utils.encode_cell({
            r: r,
            c: tCellCol
          });
          let tValue = worksheet[tCell]?.v;
          if (tValue) block.tStrs[field] = tValue;
        }
        blocks.push(block);
      }

      // Upload in chunks of 200
      let chunks = [];
      let chunkMaxSize = 200;
      let blocksToImport = blocks.length;
      let blocksImported = 0;
      logger.log(`[${sheetIndex}/${sheetCount}][${name}] 0 of ${blocksToImport.toLocaleString()} blocks uploading...`);
      while (blocks.length > 0) {
        let chunk = blocks.splice(0, chunkMaxSize);
        chunks.push(chunk);
      }
      for (let chunk of chunks) {
        let response = await fetch('/blocks/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sheet: name,
            newBlocks: chunk,
          })
        });
        if (response.status === 200) {
          let data = await response.json();
          blocksImported += chunk.length;
          importedCount += chunk.length;
          blockUpdated += data.updated;
          blockInserted += data.inserted;
          logger.log(`[${sheetIndex}/${sheetCount}][${name}] ${blocksImported.toLocaleString()} of ${blocksToImport.toLocaleString()} blocks uploaded!`);
        } else {
          logger.log('Import failed!');
          importingData = false;
          return;
        }
      }
    }

    logger.log('Upload completed!');
    logger.log(`Total ${importedCount} blocks!`);
    logger.log(`Updated ${blockUpdated} blocks!`);
    logger.log(`Inserted ${blockInserted} blocks!`);
    importFinished = true;
  }
</script>

<div class="space-y-4">
  {#if !importingData}
	  <FileInput on:change={handleFileChange} bind:files accept=".xls,.xlsx" />
  {/if}

  <div class="p-4 space-y-5 rounded shadow bg-slate-50">
    <Logger bind:this={logger} />

    {#if newSheets.length || updatedSheets.length || removedSheets.length}
      <div class="flex gap-2 text-gray-700">
        <div class="flex-1 space-y-2">
          <h1 class="text-xl font-bold">Updated Sheets</h1>
          <div class="h-64 p-2 space-y-2 overflow-y-scroll rounded-md shadow-inner bg-slate-100">
            {#each updatedSheets as sheet}
              <div>
                <div class="font-bold">{sheet.name}</div>
                <div class="flex gap-2 text-sm">
                  <div class="flex-1 space-y-1">
                    {#each sheet.oldFields as fieldObj}
                      <div class="pl-3 {fieldObj.removed ? 'text-red-700 line-through' : ''}">{fieldObj.name}</div>
                    {/each}
                  </div>
                  <div class="flex-1 space-y-1">
                    {#each sheet.newFields as fieldObj}
                      <div class="pl-3 {fieldObj.added ? 'text-green-700 underline' : ''}">{fieldObj.name}</div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="flex-1 space-y-2">
          <h1 class="text-xl font-bold">New Sheets</h1>
          <div class="h-64 p-2 space-y-2 overflow-y-scroll rounded-md shadow-inner bg-slate-100">
            {#each newSheets as sheet}
              <div>
                <div class="font-bold">{sheet.name}</div>
                <div class="flex gap-2 text-sm">
                  <div class="flex-1 space-y-1">
                    {#each sheet.fields as field}
                      <div class="pl-3 text-green-700 underline">{field}</div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="flex-1 space-y-2">
          <h1 class="text-xl font-bold">Removed Sheets</h1>
          <div class="h-64 p-2 space-y-2 overflow-y-scroll rounded-md shadow-inner bg-slate-100">
            {#each removedSheets as sheet}
              <div>
                <div class="font-bold text-red-700 line-through">{sheet.name}</div>
                <div class="flex gap-2 text-sm">
                  <div class="flex-1 space-y-1">
                    {#each sheet.fields as field}
                      <div class="pl-3 text-red-700 line-through">{field}</div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div>*** Please note that renaming sheets is not supported yet! ***</div>

      <Button on:click={uploadDefinition} bind:disabled={uploadingDefinition}>Update Definition</Button>
    {:else if definition.sheets.length && !importingData}
      <h1 class="text-xl font-bold">Definition up to date!</h1>
      <Button on:click={beginImport} bind:disabled={importingData}>Begin Import</Button>
    {/if}

    {#if importFinished}
      <h1 class="text-xl font-bold">Import finished!</h1>
      <Button on:click={() => goto('/')}>Begin Edit</Button>
    {/if}
	</div>
</div>