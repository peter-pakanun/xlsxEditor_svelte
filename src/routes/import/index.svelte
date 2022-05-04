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

  let changedSheets = [];
  let newSheets = [];

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

    changedSheets = [];
    newSheets = [];
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
        
        sheetDefinition.fields.push(field);
      }

      // compare with last definition
      let lastSheet = lastDefinition?.sheets?.find((s) => s.name === sheetname);
      let changed = false;
      if (lastSheet) {
        if (lastSheet.fields.length !== sheetDefinition.fields.length) {
          logger.log(`Sheet '${sheetname}' has different field count`);
          changed = true;
        } else {
          for (let i = 0; i < lastSheet.fields.length; i++) {
            if (lastSheet.fields[i] !== sheetDefinition.fields[i]) {
              logger.log(`Sheet '${sheetname}' has different field at ${i}`);
              changed = true;
            }
          }
        }
      } else {
        logger.log(`Found new Sheet: '${sheetname}'`);
        newSheets.push(sheetDefinition);
      }
      if (changed) {
        changedSheets.push({
          name: sheetname,
          oldFields: lastSheet?.fields,
          newFields: sheetDefinition.fields,
        });
      }

      definition.sheets.push(sheetDefinition);
    }

    changedSheets = changedSheets;
    newSheets = newSheets;

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
      changedSheets = [];
      newSheets = [];
    } else {
      logger.log('Definition upload failed!');
    }
    uploadingDefinition = false;
  }

  let importingData = false;
  async function beginImport() {
    if (importingData) return;
    importingData = true;
  }
</script>

<div class="space-y-4">
	<FileInput on:change={handleFileChange} bind:files accept=".xls,.xlsx" />

  <div class="p-4 space-y-5 rounded shadow bg-slate-50">
    <Logger bind:this={logger} />

    {#if newSheets.length || changedSheets.length}
      <div class="flex gap-2">
        <div class="flex-1">
          <h1 class="text-xl font-bold">Changed Sheets</h1>
          <div class="h-64 p-2 overflow-y-scroll shadow-inner bg-slate-100">
            {#each changedSheets as sheet}
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="font-bold">{sheet.name}</div>
                  <div class="flex text-sm">
                    <div class="flex flex-col">
                      {#each sheet.oldFields as field}
                        <div class="flex items-center">
                          <div class="flex-1">{field}</div>
                        </div>
                      {/each}
                    </div>
                    <div class="flex flex-col">
                      {#each sheet.newFields as field}
                        <div class="flex items-center">
                          <div class="flex-1">{field}</div>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="flex-1">
          <h1 class="text-xl font-bold">New Sheets</h1>
          <div class="h-64 p-2 overflow-y-scroll shadow-inner bg-slate-100">
            {#each newSheets as sheet}
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="font-bold">{sheet.name}</div>
                  <div class="text-sm">
                    {#each sheet.fields as field}
                      <div class="flex items-center">
                        <div class="flex-1">{field}</div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <Button on:click={uploadDefinition} bind:disabled={uploadingDefinition}>Upload Definition</Button>
    {:else if definition.sheets.length}
      <h1 class="text-xl font-bold">Definition up to date!</h1>
      <Button on:click={beginImport} bind:disabled={importingData}>Begin Import</Button>
    {/if}
	</div>
</div>