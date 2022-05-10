<script>
	import BlockTextarea from '$lib/components/BlockTextarea.svelte';

	export let definition = {
		sheets: [
			{
				name: 'sheet_1',
				fields: ['Fieldname'],
				attentionLevel: 1
			}
		]
	};
	export let block = {
		id: 'ID',
		sheet: 'Sheet Name',
		oStrs: {
			"Fieldname": 'Original English'
		},
		tStrs: {
			"Fieldname": 'Translated text'
		},
		aLV: 0,
		tlNote: 'Translation note will be displayed here, if any.'
	};
	export let isFirstBlock = false;
	export let isLastBlock = false;

	export let forceOpen = false;
	export let readonly = false;

	let fields = ['Fieldname'];
	$: fields = definition.sheets.find((sheet) => sheet.name === block.sheet)?.fields ?? ["Fieldname"];

	let colorClass;
	$: colorClass = 
		block.aLV >= 2 ? 'bg-red-500/75' : 
		block.aLV >= 1 ? 'bg-orange-500/75' : 
										 'bg-slate-700';

	let expaned = false;
	$: expaned = forceOpen ? true : expaned;
</script>

<div class="flex overflow-hidden text-xs rounded-lg shadow bg-slate-800 group">
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
							<input
								class="hidden peer"
								type="checkbox"
								name=""
								id=""
								tabindex="-1"
								bind:checked={expaned}
							/>
							<textarea
								bind:value={block.oStrs[field]}
								class="w-full h-8 p-1 transition-all rounded shadow-inner outline-none resize-none peer-checked:h-36 group-hover:h-36 bg-slate-500/25 text-slate-400"
								readonly
								tabindex="-1"
							/>
							<!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded outline-none pointer-events-none">{block.oStrs[field]}</div> -->
							<BlockTextarea
								bind:value={block.tStrs[field]}
								bind:expaned={expaned}
								{fields}
								{fieldId}
								{block}
								{isFirstBlock}
								{isLastBlock}
								{readonly}
								on:pageInc
							/>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
