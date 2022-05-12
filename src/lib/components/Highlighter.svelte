<script>
	import { splitTextIntoSpans } from '$lib/textAnalyzer.svelte';
	import HighlighterSpan from '$lib/components/HighlighterSpan.svelte';
  
  export let value = "";
  export let expaned = false;
  export let readonly = false;
  export let inputClass = "";
  export let spanClass = "";
  let classProp = '';
  export { classProp as class };

  let spanObjs = [];
  $: spanObjs = splitTextIntoSpans(value);
</script>

<div class="{classProp} relative overflow-hidden">
  <input
    class="hidden peer"
    type="checkbox"
    tabindex="-1"
    bind:checked={expaned}
  />
  <textarea
    bind:value={value}
    on:select
    class="block w-full h-full p-1 leading-relaxed rounded outline-none resize-none {inputClass}"
    {readonly}
    tabindex="-1"
  />

<!-- This div use whitespace-pre, it is important to make sure there're no extra whitespace inside the div. -->
<div class="absolute top-0 left-0 block w-full h-full p-1 leading-relaxed text-transparent whitespace-pre-line rounded outline-none pointer-events-none">
{#each spanObjs as spanObj}
<HighlighterSpan bind:spanObj={spanObj} {spanClass} on:tagClicked />
{/each}
</div>

</div>

