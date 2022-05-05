<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

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
    <div class="flex flex-col overflow-y-auto rounded shadow-md bg-slate-50 max-h-96">
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
  <div class="flex-1">
    {#if blocks.length}
    <div class="flex flex-col space-y-2">

      {#each blocks as block}
      <div class="flex shadow bg-slate-50">
        <div class="w-1 bg-green-200"></div>
        <div class="flex-1 px-3 py-1">
          <h1 class="underline">{block.id}</h1>
          {#each activeSheetFields as field}
          <h2 class="mb-1 text-xs">{field}</h2>
          <div class="flex gap-2 px-2 text-xs">
            <div class="flex-1">
              <textarea bind:value={block.oStrs[field]} class="w-full p-2 m-1 text-gray-600 rounded shadow-inner outline-none bg-slate-200" readonly></textarea>
            </div>
            <div class="flex-1">
              <textarea bind:value={block.tStrs[field]} class="w-full p-2 m-1 rounded shadow-inner outline-none"></textarea>
            </div>
          </div>
          {/each}
        </div>
        
      </div>
      {/each}
      
    </div>

    <table class="w-full">
      <thead>
        <tr>
          <th>ID</th>
          {#each activeSheetFields as field}
            <th>{field}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each blocks as block}
          <tr>
            <td>{block.id}</td>
            {#each activeSheetFields as field}
              <td>{block.oStrs[field]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    {/if}
  </div>
</div>