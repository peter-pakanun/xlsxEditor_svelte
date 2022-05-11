<script>
  import Phonetic from '$lib/components/Phonetic.svelte';

  let dictPromise;
  let lastString = '';
  export async function lookup(str) {
    if (str === lastString) {
      return;
    }
    lastString = str;
    dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${str}`);
    await dictPromise;
  }
</script>

<div class="px-3 py-2 space-y-2 overflow-y-auto rounded shadow bg-slate-800">
  <h1 class="font-bold underline">Dictionary</h1>
  {#if dictPromise === undefined}
  <div class="text-sm italic">
    Select a word from original field to lookup.
    <br/>
    Tip: you can double click on any word to select it.
  </div>
  {:else}
    {#await dictPromise}
      <div>Loading...</div>
    {:then result}
      {#await result.json()}
        <div>Parsing...</div>
      {:then dictObj}

        {#if !Array.isArray(dictObj)}
          <div>No results found.</div>
        {:else}

          {#each dictObj as entry}
          <div class="px-3 pt-2 pb-3 rounded shadow bg-slate-700">
            <!-- Word Link -->
            <a href={entry.sourceUrls?.[0]} class="text-lg font-bold underline text-sky-500" target="_blank">
              <span>{entry.word}</span>
              <svg class="inline-block w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
            </a>

            <!-- Phonetic -->
            <div class="italic">
              {#each entry.phonetics as phonetic, i}
                <Phonetic {phonetic} />
                {#if i != entry.phonetics.length - 1}
                  <span class="mr-1">,</span>
                {/if}
              {/each}
            </div>

            <!-- Meanings -->
            <div class="space-y-4 text-xs">
              {#each entry.meanings as meaning}
                <div>
                  <div class="mb-1 italic">{meaning.partOfSpeech}</div>

                  <div class="space-y-1">
                    {#each meaning.definitions as definitionObj, i}
                      <div>
                        <div class="indent-2 text-slate-200">{i + 1}. {definitionObj.definition}</div>
                        {#if definitionObj.example}
                          <div class="indent-3">"{definitionObj.example}"</div>
                        {/if}
                      </div>
                    {/each}
                  </div>

                  {#if meaning.synonyms?.length}
                    <div class="mb-1 indent-3">
                      <span class="text-emerald-500/75">Synonyms:</span>
                      {#each meaning.synonyms as synonym, i}
                        <span>{synonym}{#if i != meaning.synonyms.length - 1}, {/if}</span>
                        
                      {/each}
                    </div>
                  {/if}

                </div>
              {/each}
            </div>

          </div>
          {/each}

        {/if}


      {:catch error}
        <div class="text-sm text-red-500">Error: {error}</div>
      {/await}
    {:catch error}
      <div class="text-sm text-red-500">Error: {error}</div>
    {/await}
  {/if}
</div>