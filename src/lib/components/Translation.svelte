<script>
  let translatePromise;
  let lastString;
  let googleTranslateURL;
  export async function lookup(str) {
    if (str === lastString) {
      return;
    }
    lastString = str;
    translatePromise = fetch(`/translate/${str}`);
    googleTranslateURL = `https://translate.google.com/?sl=en&tl=th&text=${encodeURIComponent(str)}&op=translate`;
  }
</script>

<div class="px-3 py-2 space-y-2 overflow-y-auto rounded shadow bg-slate-800 max-h-72">
  <h1 class="font-bold underline">Azure Cognitive</h1>
  {#if translatePromise === undefined}
  <div class="text-sm italic">
    Select a word from original field to lookup.
  </div>
  {:else}
    {#await translatePromise}
      <div>Loading...</div>
    {:then result}
      {#await result.json()}
        <div>Parsing...</div>
      {:then translatedObj}

        <div class="px-3 pt-2 pb-3 rounded shadow bg-slate-700">
          <div class="text-lg font-bold text-sky-500">{translatedObj.translation}</div>

          <div class="space-y-2">
            {#each translatedObj.dicts as dict}
              <div class="text-xs">
                <span>({dict.pos}) </span>
                <span>{dict.text}</span>
                <div class="w-20 h-1 mb-1 overflow-hidden rounded-full bg-slate-400/50">
                  <div class="h-full bg-sky-500/50" style="width: {(dict.score*100).toFixed(1)}%;">&nbsp;</div>
                </div>
              </div>
            {/each}
          </div>

          <hr class="mt-2 border-slate-400/50">
          <a class="text-xs font-bold underline text-sky-500" href={googleTranslateURL} target="_blank">
            <span>Try with Google Translate</span>
            <svg class="inline-block w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
            </svg>
          </a>
        </div>

      {:catch error}
        <div class="text-sm text-red-500">Error: {error}</div>
      {/await}
    {:catch error}
      <div class="text-sm text-red-500">Error: {error}</div>
    {/await}
  {/if}
</div>