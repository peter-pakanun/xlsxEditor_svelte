<script>
  import { onMount } from 'svelte';
  import Block from '$lib/components/Block.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

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

  let curSheet = '__all';
  let curQuery = '';
  let curPage = 0;
  let curMaxPage = 0;
  let loadBlockPromise = loadBlocks();

  let curSheetIsAll = true;
  $: curSheetIsAll = curSheet === '__all';
  let curSheetIsAttention = false;
  $: curSheetIsAttention = curSheet === '__attention';

  async function loadBlocks() {
    const response = await fetch(`/blocks/${curSheet}?q=${curQuery}&page=${curPage}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const json = await response.json();
    curMaxPage = Math.ceil(json.total / json.limit);
    return json.blocks;
  }

  function setActiveSheet(sheetname) {
    definition.sheets.forEach(sheet => {
      sheet.active = sheet.name === sheetname;
    });
    definition.sheets = definition.sheets;
    lv2Sheets = lv2Sheets;
    lv1Sheets = lv1Sheets;
    if (curSheet !== sheetname) {
      curSheet = sheetname;
      curPage = 0;
      loadBlockPromise = loadBlocks();
    }
  }

  let searchBoxValue;
  let searchRef;
  async function searchKeyDown(e) {
    if (e.key === 'Enter') {
      curQuery = searchBoxValue;
      curPage = 0;
      loadBlockPromise = loadBlocks();
    }
  }
  async function docKeyDown(e) {
    if (e.target !== searchRef && (e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      e.stopPropagation();
      searchRef.focus();
      searchRef.select();
    }
    // ALT + LEFT
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      pageInc({detail: -1});
    }
    // ALT + RIGHT
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      pageInc({detail: 1});
    }
  }

  async function pageInc({ detail }) {
    curPage += detail;
    if (curPage < 0) {
      curPage = 0;
    } else if (curPage > curMaxPage - 1) {
      curPage = curMaxPage - 1;
    } else {
      loadBlockPromise = loadBlocks();
    }
  }
</script>

<svelte:head>
  <title>XLSX Editor</title>
</svelte:head>

<svelte:body on:keydown={docKeyDown}></svelte:body>

<div class="px-4 py-2 text-white bg-indigo-900/50">
  <nav class="flex items-center justify-between h-12 px-4 mx-auto text-lg max-w-7xl">
    <div class="flex items-center gap-4">
      <input type="text" class="h-8 px-3 rounded text-slate-200 bg-slate-900/50" placeholder="Search..." bind:this={searchRef} bind:value={searchBoxValue} on:keypress={searchKeyDown}>
    </div>
    <div class="flex items-center">
      <div class="flex items-center gap-3 mr-4">
        <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Left Arrow" on:click={() => pageInc({detail: -1})}>
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
        </button>
        <span>Page {curPage + 1} of {curMaxPage}</span>
        <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Right Arrow" on:click={() => pageInc({detail: 1})}>
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
        </button>
      </div>
      <Avatar />
    </div>
  </nav>
</div>

<div class="flex gap-4 px-4 m-2 mx-auto max-w-7xl">
  <div>

    <div class="flex flex-col mb-3 overflow-x-hidden rounded shadow-md bg-slate-800">
      <!-- All Sheets -->
      <div class="text-slate-100">
        <input type="checkbox" class="hidden peer" bind:checked={curSheetIsAll} />
        <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
          <div class="w-1 mr-1 bg-sky-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
          <div class="flex-1 px-4 py-2" on:click={(e) => setActiveSheet('__all')}>All Sheets</div>
        </div>
      </div>
      <!-- Red/Orange -->
      <div class="text-slate-100">
        <input type="checkbox" class="hidden peer" bind:checked={curSheetIsAttention} />
        <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
          <div class="w-1 mr-1 bg-orange-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
          <div class="flex-1 px-4 py-2" on:click={(e) => setActiveSheet('__attention')}>Attention Required</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col overflow-x-hidden overflow-y-auto rounded shadow-md bg-slate-800 max-h-96">
      {#if lv2Sheets.length}
        <h1 class="px-2 text-sm text-white bg-red-500">New Entires</h1>
        {#each lv2Sheets as sheet}
          <div class="text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-red-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
      {/if}
      {#if lv1Sheets.length}
        <h1 class="px-2 text-sm text-white bg-orange-500">Changed Entires</h1>
        {#each lv1Sheets as sheet}
          <div class="text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-orange-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
      {/if}
      {#each definition.sheets as sheet}
        {@const colorClass = sheet.attentionLevel >= 2 ? 'bg-red-500' : sheet.attentionLevel >= 1 ? 'bg-orange-500' : ''}
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
    {#await loadBlockPromise}
      Loading...
    {:then blocks} 
      {#each blocks as block, index}
        <Block {block} definition={definition} isFirstBlock={index === 0} isLastBlock={index === blocks.length - 1} on:pageInc={pageInc} />
      {:else}
        No blocks found.
      {/each}
    {:catch error}
      {error}
    {/await}
  </div>
</div>

<style>
  :global(body) {
    overflow-y: scroll;
  }
</style>