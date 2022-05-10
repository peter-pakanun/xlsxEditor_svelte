<script>
  import { onMount } from 'svelte';
  import Block from '$lib/components/Block.svelte';

  export let helpVisible = false;

  onMount(() => {
    if (window?.localStorage?.helpDiscarded === undefined) {
      helpVisible = true;
    }
  });

  function keydown(e) {
    if (e.key === 'F1') {
      e.preventDefault();
      e.stopPropagation();
      toggleHelp();
    }
  }

  function toggleHelp() {
    helpVisible = !helpVisible;
    if (!helpVisible && window?.localStorage) {
      window.localStorage.helpDiscarded = 1;
    }
  }
</script>

<svelte:window on:keydown={keydown}></svelte:window>

{#if helpVisible}
<div class="fixed top-0 left-0 z-30 w-full h-full bg-black/90">
  <div class="px-4 py-2">
    <div class="flex items-start justify-between gap-1 px-4 mx-auto text-lg max-w-7xl">

      <div class="px-3 py-2 space-y-1 rounded bg-slate-800">
        <input type="text" class="h-8 px-3 rounded text-slate-200 bg-slate-900" placeholder="Search..." readonly tabindex="-1">
        <div class="text-sm"><kbd><abbr title="Control">Ctrl</abbr> F</kbd> to focus on search box.</div>
        <div class="text-sm">Hit <kbd>Enter</kbd> to search.</div>
        <div class="text-sm">Use <kbd>?</kbd> matches one character.</div>
        <div class="text-sm">Use <kbd>*</kbd> matches zero or more characters.</div>
        <div class="text-sm">Use <kbd>\</kbd> to escape the next character.</div>
        <p class="text-sm">
          Search function will respect the sheet you are currently selected.
        </p>
      </div>

      <div class="px-3 py-2 space-y-1 rounded cursor-pointer bg-slate-800" on:click={toggleHelp}>
        <div>Press <kbd class="text-base">F1</kbd> to show/hide this help.</div>
      </div>

      <div class="px-3 py-2 space-y-1 rounded bg-slate-800">
        <div class="flex items-center">
          <div class="flex items-center gap-3">
            <span>Page 1 of Many</span>
            <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Left Arrow" tabindex="-1">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
            </button>
            <button class="p-1 transition rounded bg-slate-900/50 hover:bg-slate-600/50" title="ALT + Right Arrow" tabindex="-1">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
            </button>
          </div>
        </div>
        <div class="text-sm"><kbd><abbr title="Alternate">Alt</abbr> Left</kbd> to go back one page.</div>
        <div class="text-sm"><kbd><abbr title="Alternate">Alt</abbr> Right</kbd> to go forward one page.</div>
      </div>
      
    </div>

    <br>

    <div class="flex gap-4 px-4 m-2 mx-auto max-w-7xl">
      <div class="w-80">
        <div class="flex flex-col gap-1 mb-3 overflow-x-hidden rounded shadow-md">
          <!-- All Sheets -->
          <div class="text-slate-100 bg-slate-800">
            <input type="checkbox" class="hidden peer" />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-sky-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2">๛ All Sheets</div>
            </div>
          </div>

          <!-- Red/Orange -->
          <div class="text-slate-100 bg-slate-800">
            <input type="checkbox" class="hidden peer" />
            <div class="flex transition-all duration-75 border-b cursor-pointer border-slate-900 group peer-checked:bg-blue-500/75 hover:bg-blue-500/50">
              <div class="w-1 mr-1 bg-orange-500 group-hover:w-2 group-hover:mr-0 group-hover:transition-all group-hover:duration-75"></div>
              <div class="flex-1 px-4 py-2">๛ Attention Required</div>
            </div>
          </div>

          <div class="px-3 py-2 space-y-2 rounded bg-slate-800">
            <h1 class="font-bold underline">Sheet selector</h1>
            <div>
              <h1>All Sheets</h1>
              <div class="text-sm">Display everything, no filtering.</div>
            </div>
            <div>
              <h1>Attention Required</h1>
              <div class="text-sm">Display only sheets with orange and red cells.</div>
            </div>
            <div>
              <div class="text-sm"><kbd><abbr title="Alternate">Alt</abbr> Up</kbd> to select sheet above.</div>
              <div class="text-sm"><kbd><abbr title="Alternate">Alt</abbr> Down</kbd> to select sheet below.</div>
            </div>
          </div>

        </div>
      </div>

      <div class="flex-1 space-y-2">
        <Block forceOpen readonly />
        <div class="px-3 py-2 space-y-2 rounded bg-slate-800">
          <h1 class="font-bold underline">Translation Block</h1>
          <div class="text-sm">Press <kbd>Tab</kbd> to save translation and select next field/block.</div>
          <div class="text-sm">Press <kbd>Shift Tab</kbd> to save translation and select previous field/block.</div>
          <div class="text-sm">Holding down <kbd><abbr title="Control">Ctrl</abbr></kbd> will display block edit histories. (not implemented)</div>
          <div class="text-sm"><span class="rounded bg-red-500 text-white px-0.5 text-xs">Red block</span> There're field(s) with missing transition.</div>
          <div class="text-sm"><span class="rounded bg-orange-500 text-white px-0.5 text-xs">Orange block</span> There're field(s) with changed original English string(s).</div>
        </div>
      </div>
      
    </div>
  </div>
</div>
{/if}