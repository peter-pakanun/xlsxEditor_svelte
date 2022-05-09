<script>
	import { createEventDispatcher, onMount } from 'svelte';
	const dispatch = createEventDispatcher();

  export let value = "";
  export let fields = [];
  export let fieldId = 0;
  export let isFirstBlock = false;
  export let isLastBlock = false;

  export let block = {};
  let curFieldsLength = 0;
  $: {
    curFieldsLength = 0;
    for (const fieldKey in block.oStrs) {
			if (Object.hasOwnProperty.call(block.oStrs, fieldKey)) {
				if (fields.includes(fieldKey)) {
					curFieldsLength++;
				}
			}
		}
  }

	export let expaned = false;
  function focused(e) {
		e.target.select();
		expaned = true;
	}
	function blured() {
		expaned = false;
	}

  let editing;
  function keydown(e) {
		if (isFirstBlock && fieldId === 0 && e.key === 'Tab' && e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();
			dispatch('pageInc', -1);
		}
		if (isLastBlock && fieldId === curFieldsLength - 1 && e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();
			dispatch('pageInc', 1);
		}
	}

  let inputRef;
  onMount(() => {
		if (isFirstBlock && fieldId === 0) {
			inputRef.focus();
			inputRef.select();
		}
	});
</script>

<textarea
  bind:this={inputRef}

  bind:value={value}

  on:input={() => (editing = true)}

  on:focus={focused}
  on:blur={blured}

  on:keydown={keydown}

  class="w-full h-8 p-1 ring-offset-1 ring-offset-transparent peer-checked:h-36 transition-all rounded outline-none resize-none shadow-inner peer-checked:bg-slate-900/50 text-slate-200 {editing
    ? 'ring-2 ring-purple-800 bg-purple-900/50'
    : 'focus:ring-sky-500 focus:ring-2 bg-slate-900/25'}"
/>