<script>
	import { onMount } from 'svelte';
	export let fields = ['field_1'];
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

	let colorClass;
	$: colorClass =
		block.aLV >= 2 ? 'bg-red-500/75' : block.aLV >= 1 ? 'bg-orange-500/75' : 'bg-slate-700';
	let editing = false;

	let expaned = false;
	function focused() {
		expaned = true;
	}
	function blured() {
		expaned = false;
	}
</script>

<div class="flex overflow-hidden text-xs rounded-lg shadow bg-slate-800">
	<div class="w-1 {colorClass}" />

	<div class="flex-1">
		<div class="px-2 py-1 text-slate-100 {colorClass}">
			{block.id}
		</div>

		<div class="px-2 pt-1">
			{#if block.tlNote}
				<div class="py-1 italic text-slate-500">
					Translation Note: {block.tlNote}
				</div>
			{/if}

			{#each fields as field}
				{#if block.oStrs[field]}
					<h2 class="mb-1 text-sky-300/50">{field}</h2>
					<div class="flex gap-1 text-sm">
						<div class="relative flex flex-1 gap-2">
							<input class="hidden peer" type="checkbox" name="" id="" tabindex="-1" bind:checked={expaned} />
							<textarea
								bind:value={block.oStrs[field]}
								class="w-full h-8 p-1 transition-all rounded shadow-inner outline-none resize-none peer-checked:h-48 text-slate-400 bg-inherit peer-checked:bg-slate-900/25"
								readonly
								tabindex="-1"
							/>
							<!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded outline-none pointer-events-none">{block.oStrs[field]}</div> -->
							<textarea
								bind:value={block.tStrs[field]}
								on:input={() => (editing = true)}
								on:focus={focused}
								on:blur={blured}
								class="w-full h-8 p-1 peer-checked:h-48 transition-all rounded outline-none resize-none shadow-inner bg-slate-900/25 peer-checked:bg-slate-900/50 text-slate-200 {editing
									? 'ring-2 ring-purple-800 bg-purple-900/50'
									: ''}"
							/>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
