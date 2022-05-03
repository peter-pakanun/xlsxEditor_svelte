<script>
	export let type = 'button';

	let classProp = '';
	export { classProp as class };
</script>

<button
	{type}
	class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 {classProp}"
  {...$$restProps}
	on:click
>
	<slot />
</button>