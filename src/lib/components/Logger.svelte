<script>
  import { tick } from 'svelte';

  export let logs = [];
  export async function log(message) {
    let atBottom = containerRef.scrollTop >= (containerRef.scrollHeight - containerRef.offsetHeight);
    logs.push(message);
    logs = logs;
    await tick();
    if (atBottom) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  }
	let classProp = '';
	export { classProp as class };

  let containerRef;
</script>

<div class="bg-slate-100 rounded-md px-4 py-2 shadow-inner h-64 text-sm text-gray-700 overflow-y-scroll break-words {classProp}" bind:this={containerRef}>
  {#each logs as log}
    <div>{log}</div>
  {/each}
</div>