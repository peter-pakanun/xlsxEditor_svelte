<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let source = "";
  export let target = "";
  export let weight = 1;
  export let newTerm = false;
  export let hasConflicts = false;

  let highlighted = false;
  let formRef;
  export async function setHL(state) {
    highlighted = !!state;
    if (highlighted) {
      setTimeout(() => {
        formRef.scrollIntoView();
      }, 100);
      setTimeout(() => {
        highlighted = false;
      }, 3000);
    }
  }

  export function setSource(newStr) {
    source = newStr;
    target = "";
    weight = 0;
    sourceEdited = true;
    targetEdited = false;
    weightEdited = false;
  }

  let sourceEdited = false;
  let targetEdited = false;
  let weightEdited = false;
  let isRegex = false;
  $: {
    if (source.length >= 2 && source[0] === '/' && source[source.length - 1] === '/') {
      isRegex = true;
    } else {
      isRegex = false;
    }
  }

  async function save(e) {
    if (!sourceEdited && !targetEdited && !weightEdited) return;
    if (source.length <= 0) {
      alert("Source cannot be empty");
      return;
    }
    if (hasConflicts) {
      alert("Term's source has conflicts with other terms");
      return;
    }
    if (target.length <= 0) {
      alert("Target cannot be empty");
      return;
    }
    if (weight < 0) {
      alert("Weight must not be negative");
      return;
    }
    if (weight > 100) {
      alert("Weight must not be greater than 100");
      return;
    }
    dispatch('save');
  }
</script>

<form class="flex gap-1 p-1 overflow-hidden text-xs rounded shadow ring-sky-500 transition duration-500 { highlighted ? "ring-2 animate-pulse" : ""} { newTerm ? "bg-sky-900" : "bg-slate-900"}" on:submit|preventDefault={save} bind:this={formRef}>
  <div title="{ isRegex ? "Regex" : "Plaintext"} Mode">
    {#if isRegex}
    <svg class="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16,16.92C15.67,16.97 15.34,17 15,17C14.66,17 14.33,16.97 14,16.92V13.41L11.5,15.89C11,15.5 10.5,15 10.11,14.5L12.59,12H9.08C9.03,11.67 9,11.34 9,11C9,10.66 9.03,10.33 9.08,10H12.59L10.11,7.5C10.3,7.25 10.5,7 10.76,6.76V6.76C11,6.5 11.25,6.3 11.5,6.11L14,8.59V5.08C14.33,5.03 14.66,5 15,5C15.34,5 15.67,5.03 16,5.08V8.59L18.5,6.11C19,6.5 19.5,7 19.89,7.5L17.41,10H20.92C20.97,10.33 21,10.66 21,11C21,11.34 20.97,11.67 20.92,12H17.41L19.89,14.5C19.7,14.75 19.5,15 19.24,15.24V15.24C19,15.5 18.75,15.7 18.5,15.89L16,13.41V16.92H16V16.92M5,19A2,2 0 0,1 7,17A2,2 0 0,1 9,19A2,2 0 0,1 7,21A2,2 0 0,1 5,19H5Z" />
    </svg>
    {:else}
    <svg class="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21,6V8H3V6H21M3,18H12V16H3V18M3,13H21V11H3V13Z" />
    </svg>
    {/if}
  </div>

  <div>
    <input class="w-full px-1 rounded outline-none placeholder-slate-600 bg-slate-800 transition {hasConflicts ? "ring-red-500 ring-1" : "ring-purple-500"} {sourceEdited ? "ring-1" : ""}" type="text" bind:value={source} placeholder="Source" on:input={() => {sourceEdited = true}} on:input>
  </div>

  <div>
    <input class="w-full px-1 rounded outline-none placeholder-slate-600 bg-slate-800 ring-purple-500 {targetEdited ? "ring-1" : ""}" type="text" bind:value={target} placeholder="Target" on:input={() => {targetEdited = true}} on:input>
  </div>

  <div>
    <input class="w-12 px-1 rounded outline-none placeholder-slate-600 bg-slate-800 ring-purple-500 {weightEdited ? "ring-1" : ""}" type="number" min="0" max="100" step="1" bind:value={weight} on:input={() => {weightEdited = true}} on:input>
  </div>

  <div class="flex gap-1">
    {#if newTerm}
    <button type="submit" class="transition hover:text-slate-100">
      <svg class="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z" />
      </svg>
    </button>
    {:else if sourceEdited || targetEdited || weightEdited}
    <button type="submit" class="transition hover:text-slate-100">
      <svg class="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
      </svg>
    </button>
    {:else}
    <button class="transition hover:text-slate-100" on:click={() => dispatch('delete')}>
      <svg class="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
      </svg>
    </button>
    {/if}
  </div>
</form>