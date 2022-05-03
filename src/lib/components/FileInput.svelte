<script>
	export let id;
	export let name;
	export let multiple = false;
  export let files;
  export let accept;
  
  let classProp = '';
  export { classProp as class };
	export let inputRef = null;

  let filenameDisplay = "or drag and drop files here";
  let containerRef = null;

  function handleFileChange(e) {
    if (!files.length) {
      filenameDisplay = "or drag and drop files here";
    } else if (files.length === 1) {
      filenameDisplay = files[0].name;
    } else {
      filenameDisplay = files.length + " files selected";
    }
  }
</script>

<div bind:this={containerRef} class="relative flex items-center p-4 border border-dashed rounded border-indigo-600 {classProp}">
	<span class="px-4 py-2 text-white bg-indigo-600 rounded shrink-0">Choose Files</span>
	<span class="px-4 py-2 text-sm text-indigo-600">{filenameDisplay}</span>
	<input
		type="file"
		{name}
		{id}
		bind:this={inputRef}
    bind:files={files}
		class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer file:cursor-pointer focus:outline-none"
		{multiple}
    {accept}
    on:dragenter={containerRef.classList.remove("border-dashed")}
    on:focus={containerRef.classList.remove("border-dashed")}
    on:click={containerRef.classList.remove("border-dashed")}
    on:dragleave={containerRef.classList.add("border-dashed")}
    on:blur={containerRef.classList.add("border-dashed")}
    on:drop={containerRef.classList.add("border-dashed")}
    on:change={handleFileChange}
    on:change
		{...$$restProps}
	/>
</div>
