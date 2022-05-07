<script>
	export let value = '';
	export let id;
	export let label;
	export let type = 'text';
	export let name;
	export let required = false;

	let classProp = '';
	export { classProp as class };
	export let inputRef = null;

	function setType(node) {
		node.type = type;
	}
</script>

<div class={classProp}>
	{#if label}
		<label for={id} class="block mb-1 text-sm font-medium text-slate-400">
			{label}
		</label>
	{/if}
	<input
		use:setType
		{name}
		{id}
		{required}
		bind:value
		bind:this={inputRef}
		on:input
		on:change
		class="block w-full px-4 py-2 border rounded-md shadow-sm bg-slate-900 border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:ring-gray-500 disabled:border-slate-400 disabled:bg-slate-600 disabled:text-slate-500 disabled:focus:ring-slate-500 disabled:cursor-not-allowed read-only:ring-slate-500 read-only:border-slate-400 read-only:bg-slate-600 read-only:text-gray-400 read-only:focus:ring-gray-500 sm:text-sm"
		{...$$restProps}
	/>
</div>
