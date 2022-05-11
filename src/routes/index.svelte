<script>
  import Block from '$lib/components/Block.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import HelpOverlay from '$lib/components/HelpOverlay.svelte';
  import Dictionary from '$lib/components/Dictionary.svelte';
  import Translation from '$lib/components/Translation.svelte';
  import Termbase from '$lib/components/Termbase.svelte';

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

  let mainCatRef;
  let sheetRefMaps = {};
  let curSheet = '__all';
  let curQuery = '';
  let curPage = 0;
  let curMaxPage = 0;
  let loadBlockPromise = loadBlocks();
  let fetchingBlocks = false;

  let curSheetIsAll = true;
  $: curSheetIsAll = curSheet === '__all';
  let curSheetIsAttention = false;
  $: curSheetIsAttention = curSheet === '__attention';

  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  }

  async function loadBlocks() {
    let response;
    try {
      response = await fetchWithTimeout(`/blocks/${curSheet}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: curQuery,
          page: curPage
        })
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error("Fetching blocks timed out.");
      } else {
        throw e;
      }
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const json = await response.json();
    curMaxPage = Math.ceil(json.total / json.limit);
    return json.blocks;
  }

  async function setActiveSheet(sheetname, noJump = false) {
    if (fetchingBlocks) return;
    fetchingBlocks = true;
    definition.sheets.forEach(sheet => {
      sheet.active = sheet.name === sheetname;
    });
    definition.sheets = definition.sheets;
    lv2Sheets = lv2Sheets;
    lv1Sheets = lv1Sheets;
    if (curSheet !== sheetname) {
      if (!queryIsValid()) {
        fetchingBlocks = false;
        return;
      }
      curQuery = searchBoxValue;
      curSheet = sheetname;
      curPage = 0;
      loadBlockPromise = loadBlocks();
      await loadBlockPromise;
      fetchingBlocks = false;
      if (!noJump && sheetRefMaps[sheetname]) {
        sheetRefMaps[sheetname].scrollIntoViewIfNeeded();
      }
      if (sheetname === '__all' || sheetname === '__attention') {
        mainCatRef.scrollIntoViewIfNeeded();
      }
    }
  }

  let searchBoxValue = "";
  let searchRef;
  async function searchKeyDown(e) {
    if (e.key === 'Enter' && !fetchingBlocks) {
      if (!queryIsValid()) {
        fetchingBlocks = false;
        return;
      }
      curQuery = searchBoxValue;
      curPage = 0;
      fetchingBlocks = true;
      loadBlockPromise = loadBlocks();
      await loadBlockPromise;
      fetchingBlocks = false;
    }
  }

  function queryIsValid() {
    let splitted = searchBoxValue.trim().match(/\\?.|^$/g).reduce((p, c) => {
      if(c === '"') {
        p.quote ^= 1;
      } else if(!p.quote && c === ' ') {
        p.a.push('');
      } else {
        p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
      }
      return  p;
    }, {a: ['']}).a;
    splitted = splitted.map(s => s.trim());
    splitted = splitted.filter(s => s.length > 0);
    let hasWildcard = false;
    for (let s of splitted) {
      if (s.includes('*') || s.includes('?')) {
        hasWildcard = true;
        break;
      }
    }
    if (hasWildcard && splitted.length > 1) {
      alert('You can only search for one term at a time in wildcard mode.');
      return false;
    }
    return true;
  }

  async function docKeyDown(e) {
    if (e.target !== searchRef && (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key === 'f'))) {
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

    // ALT + UP
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      let index = definition.sheets.findIndex(sheet => sheet.name === curSheet);
      if (curSheetIsAll) {
        setActiveSheet(definition.sheets[definition.sheets.length - 1].name);
      } else if (curSheetIsAttention) {
        setActiveSheet('__all');
      } else {
        if (index > 0) {
          setActiveSheet(definition.sheets[index - 1].name);
        } else {
          setActiveSheet('__attention');
        }
      }
    }
    // ALT + DOWN
    if (e.altKey && e.key === 'ArrowDown') {
      let index = definition.sheets.findIndex(sheet => sheet.name === curSheet);
      e.preventDefault();
      e.stopPropagation();
      if (curSheetIsAll) {
        setActiveSheet('__attention');
      } else if (curSheetIsAttention) {
        setActiveSheet(definition.sheets[0].name);
      } else {
        if (index < definition.sheets.length - 1) {
          setActiveSheet(definition.sheets[index + 1].name);
        } else {
          setActiveSheet('__all');
        }
      }
    }
  }

  async function pageInc({ detail }) {
    if (fetchingBlocks) return;
    curPage += detail;
    if (curPage < 0) {
      curPage = 0;
    } else if (curPage > curMaxPage - 1) {
      curPage = curMaxPage - 1;
    } else {
      fetchingBlocks = true;
      loadBlockPromise = loadBlocks();
      await loadBlockPromise;
      fetchingBlocks = false;
    }
  }

  let dictRef, transRef, termsRef;
  async function lookup(str) {
    str = str.trim();
    if (str.length === 0) {
      return;
    }
    if (str.length > 64) {
      return;
    }
    termsRef.setNewTermSource(str);
    await Promise.all([
      dictRef.lookup(str),
      transRef.lookup(str),
    ])
    termsRef.highlighTerm(str);
  }
</script>

<svelte:head>
  <title>XLSX Editor</title>
</svelte:head>

<svelte:body on:keydown={docKeyDown}></svelte:body>

<HelpOverlay />

<div class="fixed top-0 left-0 right-0 z-30 px-4 py-2 text-white bg-indigo-900/50">
  <nav class="flex items-center justify-between h-12 px-4 mx-auto text-lg max-w-7xl">
    <div class="flex items-center gap-4">
      <input type="text" class="h-8 px-3 rounded text-slate-200 bg-slate-900/50" placeholder="Search..." bind:this={searchRef} bind:value={searchBoxValue} on:keypress={searchKeyDown}>
    </div>
    <div class="flex items-center">
      {#if curMaxPage >= 1}
      <div class="flex items-center gap-3 mr-4">
        <span>Page {curPage + 1} of {curMaxPage}</span>
        <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Left Arrow" on:click={() => pageInc({detail: -1})} tabindex="-1">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
        </button>
        <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Right Arrow" on:click={() => pageInc({detail: 1})} tabindex="-1">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
        </button>
      </div>
      {/if}
      <Avatar />
    </div>
  </nav>
</div>

<div class="flex w-full h-full gap-2 px-2 pt-16">

  <!-- Left Sidebar // Sheetlists -->
  <div class="flex-col py-2 overflow-y-scroll w-80">

    <div class="flex flex-col mb-3 overflow-x-hidden rounded shadow-md bg-slate-800" bind:this={mainCatRef}>
      <!-- All Sheets -->
      <div class="text-slate-100">
        <input type="checkbox" class="hidden peer" bind:checked={curSheetIsAll} />
        <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
          <div class="w-1 mr-1 bg-sky-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
          <div class="flex-1 px-4 py-2" on:click={(e) => setActiveSheet('__all', true)}>๛ All Sheets</div>
        </div>
      </div>
      <!-- Red/Orange -->
      <div class="text-slate-100">
        <input type="checkbox" class="hidden peer" bind:checked={curSheetIsAttention} />
        <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
          <div class="w-1 mr-1 bg-orange-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
          <div class="flex-1 px-4 py-2" on:click={(e) => setActiveSheet('__attention', true)}>๛ Attention Required</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col flex-grow-0 shadow-md">
      {#if lv2Sheets.length}
        <h1 class="px-2 overflow-hidden text-sm text-white bg-red-500 rounded-tl">Sheet with new cell</h1>
        {#each lv2Sheets as sheet}
          <div class="bg-slate-800 text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-red-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name, true)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
        <div class="h-2"></div>
      {/if}
      {#if lv1Sheets.length}
        <h1 class="px-2 overflow-hidden text-sm text-white bg-orange-500 rounded-tl">Sheet with changed cell</h1>
        {#each lv1Sheets as sheet}
          <div class="bg-slate-800 text-slate-200">
            <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-orange-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name, true)}>{sheet.name}</div>
            </div>
          </div>
        {/each}
        <div class="h-2"></div>
      {/if}

      <h1 class="px-2 overflow-hidden text-sm text-white rounded-tl bg-sky-500">All sheets</h1>
      {#each definition.sheets as sheet}
        {@const colorClass = sheet.attentionLevel >= 2 ? 'bg-red-500' : sheet.attentionLevel >= 1 ? 'bg-orange-500' : ''}
        <div class="bg-slate-800 text-slate-200" bind:this={sheetRefMaps[sheet.name]}>
          <input type="checkbox" class="hidden peer" bind:checked={sheet.active} />
          <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
            <div class="w-1 mr-1 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75 {colorClass}"></div>
            <div class="flex-1 px-4 py-2" on:click={setActiveSheet(sheet.name, true)}>{sheet.name}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Center // Block editor -->
  <div class="flex-1 py-2 space-y-2 overflow-y-scroll">
    {#await loadBlockPromise}
      <span class="text-2xl">Loading...</span>
    {:then blocks} 
      {#each blocks as block, index}
        <Block {block} definition={definition} isFirstBlock={index === 0} isLastBlock={index === blocks.length - 1} on:pageInc={pageInc} on:originalSelect={({ detail }) => lookup(detail)} />
      {:else}
        <span class="text-2xl">No results found {#if curSheet !== "__all" && curSheet !== "__attention"}<span> inside "<strong>{curSheet}</strong>" </span>{/if} for query string "<strong>{curQuery}</strong>".</span>
      {/each}
    {:catch error}
      <span class="text-2xl font-bold text-red-500">{error}</span>
    {/await}
  </div>

  <!-- Right Sidebar // Tools -->
  <div class="grid gap-2 py-2 grid-rows-8 w-96">
    <!-- Dictionary -->
    <Dictionary bind:this={dictRef} />

    <!-- Translation -->
    <Translation bind:this={transRef} />

    <!-- Termbase -->
    <Termbase bind:this={termsRef} />

    <!-- RegEx Translator -->
    <div class="px-3 py-2 overflow-y-auto rounded shadow bg-slate-800">
      <h1 class="font-bold underline">RegEx Translator</h1>

    </div>
  </div>

</div>

<style>
  :global(body), :global(html) {
    width: 100%;
    height: 100%;
    overflow-y: hidden;
  }
</style>