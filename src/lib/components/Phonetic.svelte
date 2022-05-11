<script>
  export let phonetic = {
    audio: "https://api.dictionaryapi.dev/media/pronunciations/en/sentinel-us.mp3",
    license: {name: "BY-SA 3.0", url: "https://creativecommons.org/licenses/by-sa/3.0"},
    sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=2651485",
    text: "/ˈsɛntɪnəl/"
  };
  let audioRef = null;
  
  let paused = true;

</script>

<span class="text-sm italic">
  {#if phonetic.audio}
    <audio bind:this={audioRef} bind:paused={paused}>
      <source src={phonetic.audio}>
    </audio>
    {#if paused}
      <button class="bg-slate-900/50 p-0.5 rounded-full shadow" on:click={() => audioRef.play()}>
        <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
          <path d="M0 0h24v24H0z" fill="none" />
        </svg>
      </button>
    {:else}
      <button class="bg-slate-900/50 p-0.5 rounded-full shadow" on:click={() => audioRef.pause()}>
        <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          <path d="M0 0h24v24H0z" fill="none" />
        </svg>
      </button>
    {/if}
  {/if}
  {#if phonetic.text}
    <span class="text-xs text-slate-200">{phonetic.text}</span>
  {/if}
</span>