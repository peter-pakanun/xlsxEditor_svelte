<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

  export let spanObj = {
    text: "",
    type: "",
  };
  export let spanClass = "";

  let colourClass = "";
  $: {
    if (spanObj.type === "term") {
      colourClass = "hover:ring-2 ring-blue-500/50 bg-blue-600/50 pointer-events-auto";
    } else if (spanObj.type === "strayOpen" || spanObj.type === "strayClose") {
      colourClass = "hover:ring-2 ring-red-500/50 bg-red-600/50 pointer-events-auto";
    } else if (spanObj.type !== "normal") {
      colourClass = "hover:ring-2 ring-sky-500/50 bg-sky-600/50 pointer-events-auto";
    }
  }
</script>

<span class="transition rounded cursor-pointer {colourClass} {spanClass}" on:click={(e) => dispatch("tagClicked", spanObj)}>{spanObj.text}</span>