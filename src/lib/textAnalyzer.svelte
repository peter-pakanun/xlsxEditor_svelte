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
    }, acc);

    // check if last tag has no end
    if (tags.a[tags.a.length-1].s && !tags.a[tags.a.length-1].e) {
      tags.a[tags.a.length-1].e = tags.i;
      tags.a[tags.a.length-1].c = "strayOpen";
    }

    // remove empty tags and unused index
    tags = tags.a.filter(t => t.t);

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

  export function splitTextIntoSpans(str) {
    let tags = analyzeText(str);
		if (!Array.isArray(tags) || tags.length === 0) {
			return [];
		}

    tags.sort((a, b) => b.e - a.e);

		let before = str;
		let accumulator = [];
    let posFromLast = 0;
		for (let tag of tags) {
			let after = before.substring(tag.e + 1);
			let inside = before.substring(tag.s, tag.e + 1);
			before = before.substring(0, tag.s);

      if (after.length > 0) {
        accumulator.push({
          posFromLast: posFromLast++,
          type: "normal",
          text: after,
        });
      }
      if (inside.length > 0) {
        accumulator.push({
          posFromLast: posFromLast++,
          type: tag.c,
          text: inside,
          replace: tag.t,
        });
      }
		}

    // add the last text, if any
    if (before.length > 0) {
      accumulator.push({
        posFromLast: posFromLast++,
        type: "normal",
        text: before,
      });
    }

    accumulator.sort((a, b) => b.posFromLast - a.posFromLast);

    let output = [];
    let index = 0;
    for (let span of accumulator) {
      let spanObj = {
        type: span.type,
        text: span.text,
        replace: span.replace,
      };
      if (span.type !== "normal") {
        spanObj.index = index++;
      }
      output.push(spanObj);
    }
		return output;
  }
</script>