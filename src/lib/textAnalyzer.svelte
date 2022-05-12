<script context="module">
	import { get } from 'svelte/store';
  import { termsStore } from '$lib/stores.js';
  export function analyzeText(str) {
    if (!str || typeof str !== 'string') {
      return [];
    }
    // find {} tag
    let acc = {
      a: [{ t: "" }], // t: text, s: start, e: end, c: code (falsy = ok, 1 = start before end, 2 = end without start)
      i: 0
    };
    let tags = str.match(/\\?.|^$/g).reduce((p, c) => {
      if (c === "{") {
        if (p.a[p.a.length-1].s) {
          // this is open again before close
          p.a[p.a.length-1].e = p.i - 1;
          p.a[p.a.length-1].c = 1;
          p.a.push({ t: "", s: p.i });
        } else {
          p.a[p.a.length-1].s = p.i;
        }
        p.a[p.a.length-1].t += c;
      } else if (c === "}") {
        p.a[p.a.length-1].t += c;
        if (!p.a[p.a.length-1].s) {
          // this is close without open
          p.a[p.a.length-1].s = p.i;
          p.a[p.a.length-1].e = p.i;
          p.a[p.a.length-1].c = 2;
        } else {
          p.a[p.a.length-1].e = p.i;
        }
        p.a.push({ t: "" });
      } else if (p.a[p.a.length-1].s && !p.a[p.a.length-1].e) {
        p.a[p.a.length-1].t += c;
      }
      p.i += c.length;
      return p;
    }, acc).a;

    // remove empty tags
    tags = tags.filter(t => t.t);

    // find terms
    let terms = get(termsStore);
    let termsFound = [];
    let curIndex = 0;
    while (true) {
      let found = false;
      for (let term of terms) {
        // TODO: suport regex
        let foundIndex = str.toLowerCase().indexOf(term.source.toLowerCase(), curIndex);
        if (foundIndex !== -1) {
          termsFound.push({
            t: term.target,
            s: foundIndex,
            e: foundIndex + term.source.length - 1
          });
          curIndex = foundIndex + term.source.length;
          found = true;
        }
      }
      if (!found || curIndex >= str.length) {
        break;
      }
    }

    if (termsFound.length) {
      console.log(termsFound);
    }

    return tags;
  }
</script>