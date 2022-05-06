<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Block from '$lib/components/Block.svelte';

  export let blocks = [];
  export let definition;
  
  let lv2Sheets = [];
  for (let sheet of definition.sheets) {
    if (sheet.attentionLevel == 2) {
      lv2Sheets.push(sheet);
    }
  }
  
  let lv1Sheets = [];
  for (let sheet of definition.sheets) {
    if (sheet.attentionLevel == 1) {
      lv1Sheets.push(sheet);
    }
  }

  onMount(() => {
    if (lv2Sheets.length > 0) {
      setActiveSheet(lv2Sheets[0].name);
    } else if (lv1Sheets.length > 0) {
      setActiveSheet(lv1Sheets[0].name);
    } else {
      setActiveSheet(definition.sheets[0].name);
    }
  });

  let activeSheet;
  let activeSheetFields;
  function setActiveSheet(sheetname) {
    definition.sheets.forEach(sheet => {
      sheet.active = sheet.name === sheetname;
    });
    definition.sheets = definition.sheets;
    lv2Sheets = lv2Sheets;
    lv1Sheets = lv1Sheets;
    activeSheet = sheetname;
    activeSheetFields = definition.sheets.find(sheet => sheet.name === sheetname).fields;

    curPage = 0;
    loadBlocks();
  }

  let curPage = 0;
  async function loadBlocks() {
    blocks = [];
    const response = await fetch(`/blocks/${activeSheet}/${curPage}`);
    if (response.ok) {
      const json = await response.json();
      blocks = json;
    } else {
      console.log('error');
      alert('error');
    }
  }
</script>

<div class="flex gap-4 m-2 mx-auto max-w-7xl">
  <div>
    <div class="flex flex-col overflow-x-hidden overflow-y-auto rounded shadow-md bg-slate-800 max-h-96">
      {#if lv2Sheets.length}
        <h1 class="px-2 text-sm text-white bg-red-500/75">New Entires</h1>
        {#each lv2Sheets as sheet}
          <div class="text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-red-500/75 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
      {/if}
      {#if lv1Sheets.length}
        <h1 class="px-2 text-sm text-white bg-orange-500/75">Changed Entires</h1>
        {#each lv1Sheets as sheet}
          <div class="text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-orange-500/75 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
      {/if}
      {#each definition.sheets as sheet}
        {@const colorClass = sheet.attentionLevel >= 2 ? 'bg-orange-500/75' : sheet.attentionLevel >= 1 ? 'bg-orange-500/75' : ''}
        <div class="text-slate-200">
          <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
          <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
            <div class="w-1 mr-1 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75 {colorClass}"></div>
            <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name)}>{sheet.name}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex-1 space-y-2">
    {#if blocks.length}
      {#each blocks as block}
        <Block {block} fields={activeSheetFields} />
      {/each}
    {/if}
  </div>
</div>