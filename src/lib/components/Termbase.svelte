<script>
  import { onMount } from 'svelte';
  import { termsStore } from '$lib/stores.js';
	import Term from '$lib/components/Term.svelte';
  
  export async function loadTerms() {
    $termsStore = await fetch('/termbase').then(res => res.json());
    $termsStore.sort((a, b) => a.source.localeCompare(b.source)).sort((a, b) => b.weight - a.weight);
  }
  
  let newTermRef;
  let newTermSource = "";
  let newTermTarget = "";
  let newTermWeight = 1;
  let newTermHasConflicts = false;
  export function highlighTerm(sourceStr) {
    let term = $termsStore.find(term => term.source.toLowerCase() === sourceStr.toLowerCase());
    if (term?.ref) {
      term.ref.setHL(true);
    } else {
      newTermRef.setHL(true);
    }
  }

  export function setNewTermSource(sourceStr) {
    let term = $termsStore.find(term => term.source.toLowerCase() === sourceStr.toLowerCase());
    if (!term?.ref) {
      newTermRef.setSource(sourceStr);
    }
  }

  async function checkConflicts() {
    // clear conflicts
    newTermHasConflicts = false;
    for (let term of $termsStore) {
      term.hasConflicts = false;
    }
    // check against new term
    for (let term of $termsStore) {
      if (term.source.toLowerCase() === newTermSource.toLowerCase()) {
        newTermHasConflicts = true;
        term.hasConflicts = true;
        console.log("conflict");
        break;
      }
    }
    // check against other terms
    for (let term of $termsStore) {
      let t = $termsStore.find(t => t.source.toLowerCase() === term.source.toLowerCase());
      if (t && t !== term) {
        term.hasConflicts = true;
        t.hasConflicts = true;
        console.log("conflict");
      }
    }
    // https://github.com/sveltejs/svelte/issues/3973
    // $termsStore.sort((a, b) => a.source.localeCompare(b.source)).sort((a, b) => b.weight - a.weight);
    //$termsStore = terms = terms;
  }

  async function createTerm() {
    let res = await fetch('/termbase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        source: newTermSource,
        target: newTermTarget,
        weight: newTermWeight
      })
    });
    let data = await res.json();
    if (!res.ok) {
      alert("Failed to create term:\n" + data.message);
      return;
    }
    newTermRef.setSource("");

    loadTerms();
  }
  
  async function editTerm(term) {
    let res = await fetch('/termbase/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _id: term._id,
        source: term.source,
        target: term.target,
        weight: term.weight
      })
    });
    let data = await res.json();
    if (!res.ok) {
      alert("Failed to edit term:\n" + data.message);
      return;
    }

    term.ref.resetEdited();

    await loadTerms();
    let newTerm = $termsStore.find(t => t._id === term._id);
    if (newTerm.ref) {
      newTerm.ref.resetEdited();
      newTerm.ref.setHL(true, true);
    }
  }
  
  async function deleteTerm(term) {
    if (!confirm("Are you sure you want to delete this term?")) {
      return;
    }
    let res = await fetch('/termbase/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _id: term._id
      })
    });
    let data = await res.json();
    if (!res.ok) {
      alert("Failed to delete term:\n" + data.message);
      return;
    }
    loadTerms();
  }
  
  onMount(loadTerms);
</script>

<div class="px-3 py-2 overflow-y-auto rounded shadow bg-slate-800">
	<h1 class="mb-2 font-bold underline">Termbase</h1>
  
  <Term
    newTerm={true}
    bind:source={newTermSource}
    bind:target={newTermTarget}
    bind:weight={newTermWeight}
    bind:hasConflicts={newTermHasConflicts}
    bind:this={newTermRef}
    on:input={checkConflicts}
    on:save={createTerm}
  />
  
	<div class="py-2 space-y-0.5">
    {#each $termsStore as term}
		<Term
      bind:source={term.source}
      bind:target={term.target}
      bind:weight={term.weight}
      bind:hasConflicts={term.hasConflicts}
      bind:this={term.ref}
      on:input={checkConflicts}
      on:save={() => editTerm(term)}
      on:delete={() => deleteTerm(term)}
    />
    {/each}
	</div>
</div>
