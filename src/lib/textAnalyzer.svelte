<script context="module">
  import { termsStore } from '$lib/stores.js';

  let terms = [];
  termsStore.subscribe(value => {
		terms = value;
	});

  export function analyzeText(str) {
    if (!str || typeof str !== 'string') {
      return [];
    }
    // find {} tag
    let acc = {
      a: [{ t: "" }], // t: text, s: start, e: end, c: code
      i: 0
    };
    let tags = str.match(/\\?.|^$/g).reduce((p, c) => {
      if (c === "{") {
        if (p.a[p.a.length-1].s) {
          // this is open again before close
          p.a[p.a.length-1].e = p.i - 1;
          p.a[p.a.length-1].c = "strayOpen";
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
          p.a[p.a.length-1].c = "strayClose";
        } else {
          p.a[p.a.length-1].e = p.i;
          p.a[p.a.length-1].c = "GGGtag";
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
            e: foundIndex + term.source.length - 1,
            c: "term"
          });
          curIndex = foundIndex + term.source.length;
          found = true;
        }
      }
      if (!found || curIndex >= str.length) {
        break;
      }
    }

    tags = tags.filter(tag => {
      for (let term of termsFound) {
        if (tag.s <= term.s && tag.e >= term.s) {
          return false;
        }
        if (tag.s <= term.e && tag.e >= term.e) {
          return false;
        }
        if (tag.s >= term.s && tag.e <= term.e) {
          return false;
        }
      }
      return true;
    })

    let tagsAndTerms = tags.concat(termsFound);

    return tagsAndTerms;
  }
</script>