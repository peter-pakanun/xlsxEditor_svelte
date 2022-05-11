<script>
	import Term from '$lib/components/Term.svelte';
	let terms = [
    {
      source: "Bronze",
      target: "บรอนซ์",
      weight: 0,
      ref: null,
    },
	];
  //$: terms = terms.sort((a, b) => a.source.localeCompare(b.source)).sort((a, b) => b.weight - a.weight);
  
  let newTerm;
  export function highlighTerm(sourceStr) {
    let term = terms.find(term => term.source.toLowerCase() === sourceStr.toLowerCase());
    if (term?.ref) {
      term.ref.setHL(true);
    }
  }

  export function setNewTermSource(sourceStr) {
    let term = terms.find(term => term.source.toLowerCase() === sourceStr.toLowerCase());
    if (!term?.ref) {
      newTerm.setSource(sourceStr);
    }
  }

</script>

<div class="px-3 py-2 overflow-y-auto rounded shadow bg-slate-800">
	<h1 class="font-bold underline">Termbase</h1>
  
  <Term newTerm={true} bind:this={newTerm} />
  
	<div class="py-2 space-y-0.5">
    {#each terms as term}
		<Term {term} bind:this={term.ref} />
    {/each}
	</div>
</div>
