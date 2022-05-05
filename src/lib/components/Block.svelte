<script>
  import { onMount } from 'svelte';
  export let fields = ["field_1"];
  export let block = {
    id: "identifier",
    sheet: "sheet_name",
    oStrs: {
      field_1: "value"
    },
    tStrs: {
      field_1: "value"
    },
    hasChanged: false,
    tlNote: "TLNote",
  };

  let colorClass = block?.hasChanged ? "bg-orange-300" : "bg-blue-300";
  
  onMount(() => {
    // check if there's a missing translation
    fields.forEach(field => {
      if (block.oStrs[field] && !block.tStrs[field]) {
        colorClass = "bg-red-300";
      }
    });
  });
</script>


<div class="flex text-xs rounded shadow bg-slate-50">
  <div class="w-1 rounded-l {colorClass}"></div>

  <div class="flex-1">
    <div class="px-2 text-white rounded-tr {colorClass}">
      {block.id}
    </div>

    <div class="px-2 pt-1">
      {#if block.tlNote}<div class="py-1 text-gray-600">Translation note: {block.tlNote}</div>{/if}
      
      {#each fields as field}
      {#if block.oStrs[field]}
      <h2 class="mb-1">{field}</h2>
      <div class="flex gap-1 text-sm">
        <div class="relative flex-1">
          <textarea bind:value={block.oStrs[field]} class="w-full h-20 p-1 text-gray-600 rounded shadow-sm outline-none resize-none bg-slate-200" readonly></textarea>
          <!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded shadow-sm outline-none pointer-events-none">{block.oStrs[field]}</div> -->
        </div>
        <div class="flex-1">
          <textarea bind:value={block.tStrs[field]} class="w-full h-20 p-1 bg-white rounded shadow-sm outline-none resize-none"></textarea>
        </div>
      </div>
      {/if}
      {/each}
    </div>
  </div>
  
</div>