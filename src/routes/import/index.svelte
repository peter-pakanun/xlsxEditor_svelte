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
		let definition = {
			language: user.language,
			sheets: []
		};

    for (let sheetname of workbook.SheetNames) {
      let sheet = workbook.Sheets[sheetname];
      let sheetDefinition = {
        name: sheetname,
        fields: [],
        hasTranslationNote: false,
      };

      // check if Cell A1 is "ID" or not
      if (sheet['A1']?.v !== 'ID') {
        logger.log(`Sheet '${sheetname}' has no ID column, abort.`);
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
        logger.log(`Sheet '${sheetname}' has invalid column count, abort.`);
        return;
      }

      // Get all fields
      for (let c = sheetDefinition.hasTranslationNote ? 2 : 1; c < colCount; c += 3) {
        let fieldCell = utils.encode_cell({ c, r: 0 });
        let field = sheet[fieldCell]?.v;
        if (!field) {
          logger.log(`Sheet '${sheetname}' has no field at column ${c}, abort.`);
          return;
        }
        let translationCell = utils.encode_cell({ c: c + 1, r: 0 });
        let translation = sheet[translationCell]?.v;
        if (translation !== 'Translation') {
          logger.log(`Sheet '${sheetname}' has no translation at column ${c + 1}, abort.`);
          return;
        }
        // if this is a second or later iteration, check preceding field if it's undefined
        if (c > 2 && sheet[utils.encode_cell({ c: c - 1, r: 0 })]?.v !== undefined) {
          logger.log(`Sheet '${sheetname}' has no null field at column ${c - 1}, abort.`);
          return;
        }
        
        sheetDefinition.fields.push(field);
      }

      definition.sheets.push(sheetDefinition);
    }

    logger.log('Definition loaded!');
    console.log(definition);
	}
</script>

<div class="space-y-4">
	<FileInput on:change={handleFileChange} bind:files accept=".xls,.xlsx" />

  <div class="bg-slate-50 shadow rounded p-4">
    <Logger bind:this={logger} />
	</div>
</div>