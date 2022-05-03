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
		<label for={id} class="block mb-1 text-sm font-medium text-gray-700">
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
		class="block w-full px-4 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:ring-gray-500 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:focus:ring-gray-500 disabled:cursor-not-allowed read-only:ring-gray-500 read-only:border-gray-200 read-only:bg-gray-50 read-only:text-gray-400 read-only:focus:ring-gray-500 sm:text-sm"
		{...$$restProps}
	/>
</div>
