import clientPromise from '$lib/db';
import { v4 as uuidv4 } from "uuid";
import dotenv from 'dotenv';
dotenv.config();

let posMap = {
  "ADJ": "adjective",
  "ADV": "adverb",
  "CONJ": "conjunction",
  "DET": "determiner",
  "MODAL": "verb",
  "NOUN": "noun",
  "PREP": "preposition",
  "PRON": "pronoun",
  "VERB": "verb",
  "OTHER": "other",
}

export async function get({ params, locals, url }) {
  let { user } = locals;
  let { str } = params;

  if (!user) {
    return {
      status: 401,
    };
  }
  if (!user.language) {
    return {
      status: 403,
    };
  }
  if (!str || typeof str !== 'string' || str.trim().length === 0) {
    return {
      status: 400,
    };
  }
  str = str.trim().toLowerCase();

  const client = await clientPromise;
  const TranslationCache = client.db().collection('TranslationCache');

  let cache = await TranslationCache.findOne({
    source: str,
    language: user.language,
  }).catch((e) => { console.error(e); });

  if (cache) {
    if (cache.updatedAt > Date.now() - 1000 * 60 * 60 * 24 * 90) {
      return {
        status: 200,
        body: {
          translation: cache.translation,
          dicts: cache.dicts,
        }
      };
    } else {
      await TranslationCache.deleteOne({
        source: str,
        language: user.language,
      }).catch((e) => { console.error(e); });
    }
  }

  let promises = [];
  promises.push(
    fetch("https://api.cognitive.microsofttranslator.com/translate?" + new URLSearchParams({
      "api-version": '3.0',
      "from": 'en',
      "to": "th",
    }), {
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATE_KEY,
        'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATE_REGION,
        'Content-Type': 'application/json',
        'X-ClientTraceId': uuidv4().toString(),
      },
      body: JSON.stringify([{
        "text": str,
      }]),
    }).then(res => res.json())
  );
  promises.push(
    fetch("https://api.cognitive.microsofttranslator.com/dictionary/lookup?" + new URLSearchParams({
      "api-version": '3.0',
      "from": 'en',
      "to": "th",
    }), {
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATE_KEY,
        'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATE_REGION,
        'Content-Type': 'application/json',
        'X-ClientTraceId': uuidv4().toString(),
      },
      body: JSON.stringify({
        "text": str,
      }),
    }).then(res => res.json())
  );

  let [translation, dictionary] = await Promise.all(promises);

  if (!Array.isArray(translation) || translation.length === 0) {
    return {
      status: 404,
    };
  }
  translation = translation[0].translations[0].text;

  if (!dictionary?.displaySource) {
    return {
      status: 404,
    };
  }
  let dicts = dictionary.translations.map(dict => {
    pos = posMap[dict.posTag] || "Other";
    return {
      text: dict.displayTarget,
      score: dict.confidence,
      pos,
    };
  });

  await TranslationCache.insertOne({
    source: str,
    language: user.language,
    translation,
    dicts,
    updatedAt: Date.now(),
  }).catch((e) => { console.error(e); });

  return {
    body: {
      translation,
      dicts,
    }
  }
}