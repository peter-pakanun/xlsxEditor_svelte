<script>
	import { createEventDispatcher, onMount } from 'svelte';
	const dispatch = createEventDispatcher();

	export let definition = {
		sheets: [
			{
				name: 'sheet_1',
				fields: ['field_1'],
				attentionLevel: 1
			},
		]
	};
	export let block = {
		id: 'identifier',
		sheet: 'sheet_name',
		oStrs: {
			field_1: 'value'
		},
		tStrs: {
			field_1: 'value'
		},
		aLV: 0,
		tlNote: 'TLNote'
	};
	export let isFirstBlock = false;
	export let isLastBlock = false;

	let editorRef = [];

	let fields = ['field_1'];
	$: fields = definition.sheets.find(sheet => sheet.name === block.sheet).fields;

	let colorClass;
	$: colorClass =
		block.aLV >= 2 ? 'bg-red-500/75' : block.aLV >= 1 ? 'bg-orange-500/75' : 'bg-slate-700';
	let editing = false;

	let expaned = false;
	function focused(e) {
		e.target.select();
		expaned = true;
	}
	function blured() {
		expaned = false;
	}
	function keydown(e, fieldId) {
		let curFieldsLength = 0;
		for (const fieldKey in block.oStrs) {
			if (Object.hasOwnProperty.call(block.oStrs, fieldKey)) {
				if (fields.includes(fieldKey)) {
					curFieldsLength++;
				}
			}
		}
		
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
	onMount(() => {
		if (isFirstBlock) {
			editorRef[0].focus();
			editorRef[0].select();
		}
	});
</script>

<div class="flex overflow-hidden text-xs rounded-lg shadow bg-slate-800">
	<div class="w-1 {colorClass}" />

	<div class="flex-1">
		<div class="px-2 py-1 text-slate-100 {colorClass}">
			{block.sheet} -> {block.id}
		</div>

		<div class="px-2 py-1">
			{#if block.tlNote}
				<div class="py-1 italic text-slate-500">
					Translation Note: {block.tlNote}
				</div>
			{/if}

			{#each fields as field, fieldId}
				{#if block.oStrs[field]}
					<h2 class="mb-1 text-sky-300/50">{field}</h2>
					<div class="flex gap-1 text-sm">
						<div class="relative flex flex-1 gap-2">
							<input class="hidden peer" type="checkbox" name="" id="" tabindex="-1" bind:checked={expaned} />
							<textarea
								bind:value={block.oStrs[field]}
								class="w-full h-8 p-1 transition-all rounded shadow-inner outline-none resize-none peer-checked:h-36 text-slate-400 bg-inherit peer-checked:bg-slate-900/25"
								readonly
								tabindex="-1"
							/>
							<!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded outline-none pointer-events-none">{block.oStrs[field]}</div> -->
							<textarea
								bind:this={editorRef[fieldId]}
								bind:value={block.tStrs[field]}
								on:input={() => (editing = true)}
								on:focus={focused}
								on:blur={blured}
								on:keydown={(e) => keydown(e, fieldId)}
								class="w-full h-8 p-1 ring-offset-1 ring-offset-transparent peer-checked:h-36 transition-all rounded outline-none resize-none shadow-inner peer-checked:bg-slate-900/50 text-slate-200 {editing
									? 'ring-2 ring-purple-800 bg-purple-900/50'
									: 'focus:ring-sky-500 focus:ring-2 bg-slate-900/25'}"
							/>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
