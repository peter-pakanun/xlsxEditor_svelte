<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Block from '$lib/components/Block.svelte';

  export let blocks = [];
  export let definition;
  definition.sheets.sort((a, b) => b.attentionLevel - a.attentionLevel);

  onMount(() => {
    setActiveSheet(definition.sheets[0].name);
  });

  let activeSheet;
  let activeSheetFields;
  function setActiveSheet(sheetname) {
    definition.sheets.forEach(sheet => {
      sheet.active = sheet.name === sheetname;
    });
    definition.sheets = definition.sheets;
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
      console.log(blocks);
    } else {
      console.log('error');
      alert('error');
    }
  }
</script>

<div class="flex gap-4 m-2">
  <div>
    <div class="flex flex-col overflow-x-hidden overflow-y-auto rounded shadow-md bg-slate-50 max-h-96">
      {#each definition.sheets as sheet}
        {@const colorClass = sheet.attentionLevel >= 2 ? 'bg-red-300' : sheet.attentionLevel >= 1 ? 'bg-orange-300' : ''}
        <div>
          <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
          <div class="flex transition-all duration-75 border-b cursor-pointer group peer-checked:bg-blue-100 hover:bg-blue-100">
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