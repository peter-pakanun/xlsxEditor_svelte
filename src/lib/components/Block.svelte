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
</script>

<div class="flex overflow-hidden text-xs rounded-lg shadow bg-slate-800">
	<div class="w-1 {colorClass}" />

	<div class="flex-1">
		<div class="px-2 py-1 text-sky-300 {colorClass}">
			{block.id}
		</div>

		<div class="px-2 pt-1">
			{#if block.tlNote}<div class="py-1 italic text-slate-500">Translation Note: {block.tlNote}</div>{/if}

			{#each fields as field}
				{#if block.oStrs[field]}
					<h2 class="mb-1">{field}</h2>
					<div class="flex gap-1 text-sm">
						<div class="relative flex-1">
							<textarea
								bind:value={block.oStrs[field]}
								class="w-full h-20 p-1 rounded shadow-sm outline-none resize-none text-slate-400 bg-slate-900/25"
								readonly
							/>
							<!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded shadow-sm outline-none pointer-events-none">{block.oStrs[field]}</div> -->
						</div>
						<div class="flex-1">
							<textarea
								bind:value={block.tStrs[field]}
								on:input={() => (editing = true)}
								class="w-full h-20 p-1 rounded shadow-sm outline-none resize-none bg-slate-900/50 text-slate-200 {editing
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
