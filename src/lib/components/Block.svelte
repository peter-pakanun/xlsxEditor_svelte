<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import BlockTextarea from '$lib/components/BlockTextarea.svelte';
	import Highlighter from '$lib/components/Highlighter.svelte';

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

	let selectDelayTimeout;
	function onOriginalSelect(e) {
		let selectedText = "";
		if (window.getSelection) {
			selectedText = window.getSelection().toString();
		} else if (document.selection && document.selection.type != "Control") {
			selectedText = document.selection.createRange().text;
		}
		if (selectDelayTimeout) {
			clearTimeout(selectDelayTimeout);
		}
		selectDelayTimeout = setTimeout(() => {
			dispatch('lookupWord', selectedText);
		}, 200);
	}

	let textInputRefs = [];
	function tagClicked(tag, fieldId) {
		if (tag.type === 'term') {
			dispatch('lookupWord', tag.text);
			textInputRefs[fieldId].pasteText(tag.replace);
		}
		else if (tag.type === 'GGGtag') {
			textInputRefs[fieldId].pasteText(tag.replace);
		}
		else if (tag.type === 'strayOpen') {
			alert('Stray open bracket');
		}
		else if (tag.type === 'strayClose') {
			alert('Stray close bracket');
		}
	}
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
							<Highlighter
								bind:value={block.oStrs[field]}
								bind:expaned={expaned}
								on:select={onOriginalSelect}
								on:tagClicked={({ detail }) => { tagClicked(detail, fieldId) }}
								class="w-full h-8 transition-all peer-checked:h-36 group-hover:h-36"
								inputClass="bg-slate-500/25 text-slate-200"
								spanClass="text-slate-200"
								readonly
							/>
							<!-- <div class="absolute top-0 left-0 w-full h-20 p-1 text-orange-100 rounded outline-none pointer-events-none">{block.oStrs[field]}</div> -->
							<BlockTextarea
								bind:value={block.tStrs[field]}
								bind:expaned={expaned}
								bind:this={textInputRefs[fieldId]}
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