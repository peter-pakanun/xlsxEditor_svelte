<script>
  export let definition;

  definition.sheets.sort((a, b) => b.attentionLevel - a.attentionLevel);

  function setActiveSheet(sheetname) {
    definition.sheets.forEach(sheet => {
      sheet.active = sheet.name === sheetname;
    });
    definition.sheets = definition.sheets;
  }
</script>

<div class="grid grid-cols-2 gap-4 m-2">
  <div class="max-w-xs rounded shadow bg-slate-50">
    <div class="flex flex-col overflow-y-auto shadow-inner max-h-96">
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
</div>