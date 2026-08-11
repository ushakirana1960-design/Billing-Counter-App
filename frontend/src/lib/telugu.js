// Offline English -> Telugu transliteration (script conversion, NOT translation).

const VOWELS = {
  au: "ఔ", ai: "ఐ", aa: "ఆ", ee: "ఈ", ii: "ఈ", oo: "ఊ", uu: "ఊ",
  a: "అ", i: "ఇ", u: "ఉ", e: "ఎ", o: "ఒ", A: "ఆ", I: "ఈ", U: "ఊ", E: "ఏ", O: "ఓ",
};

const MATRA = {
  au: "ౌ", ai: "ై", aa: "ా", ee: "ీ", ii: "ీ", oo: "ూ", uu: "ూ",
  a: "", i: "ి", u: "ు", e: "ె", o: "ొ", A: "ా", I: "ీ", U: "ూ", E: "ే", O: "ో",
};

const VOWEL_KEYS = ["au", "ai", "aa", "ee", "ii", "oo", "uu", "A", "I", "U", "E", "O", "a", "i", "u", "e", "o"];

const CONS = {
  kSh: "క్ష", ksh: "క్ష", gny: "జ్ఞ", shr: "శ్ర",
  chh: "ఛ", Th: "ఠ", Dh: "ఢ", kh: "ఖ", gh: "ఘ", ch: "చ", jh: "ఝ",
  th: "థ", dh: "ధ", ph: "ఫ", bh: "భ", sh: "శ", Sh: "ష", ng: "ంగ",
  k: "క", g: "గ", c: "క", j: "జ", T: "ట", D: "డ", N: "ణ", t: "త", d: "ద",
  n: "న", p: "ప", f: "ఫ", b: "బ", m: "మ", y: "య", r: "ర", R: "ఱ", l: "ల",
  L: "ళ", v: "వ", w: "వ", s: "స", S: "ష", h: "హ", z: "జ", x: "క్స", q: "క",
};

const CONS_KEYS = Object.keys(CONS).sort((a, b) => b.length - a.length);

const DICT = {
  venna: "వెన్న", palu: "పాలు", perugu: "పెరుగు", neyyi: "నెయ్యి",
  biyyam: "బియ్యం", kandipappu: "కందిపప్పు", panchadara: "పంచదార",
  uppu: "ఉప్పు", noone: "నూనె", nune: "నూనె", pasupu: "పసుపు",
  karam: "కారం", ramesh: "రమేష్", lakshmi: "లక్ష్మి", srinu: "శ్రీను",
  gaaru: "గారు", garu: "గారు", akka: "అక్క", anna: "అన్న",
};

export function toTelugu(input) {
  if (!input) return "";
  return input
    .split(/(\s+)/)
    .map((w) => (/^\s+$/.test(w) ? w : wordToTelugu(w)))
    .join("");
}

function wordToTelugu(word) {
  const low = word.toLowerCase();
  if (DICT[low]) return DICT[low];
  if (/^[0-9.,\-/()%&+]+$/.test(word)) return word;

  let out = "";
  let i = 0;
  const s = word;
  while (i < s.length) {
    const rest = s.slice(i);

    // anusvara: m / n before a consonant, or trailing m
    const ch = s[i];
    if ((ch === "m" || ch === "n") && i > 0) {
      const nxt = s[i + 1];
      const isEnd = nxt === undefined;
      const nextIsCons = nxt && !"aeiouAEIOU".includes(nxt) && (ch !== nxt);
      if ((isEnd && ch === "m") || (nextIsCons && !"hy".includes(nxt))) {
        out += "ం";
        i += 1;
        continue;
      }
    }

    const cons = CONS_KEYS.find((k) => rest.startsWith(k));
    if (cons) {
      let base = CONS[cons];
      i += cons.length;
      // gemination: kk, tt, nn, ll ...
      const after = s.slice(i);
      const vKey = VOWEL_KEYS.find((k) => after.startsWith(k));
      if (vKey) {
        out += base + MATRA[vKey];
        i += vKey.length;
      } else {
        out += base + "్";
      }
      continue;
    }

    const vKey = VOWEL_KEYS.find((k) => rest.startsWith(k));
    if (vKey) {
      out += VOWELS[vKey];
      i += vKey.length;
      continue;
    }
    out += s[i];
    i += 1;
  }
  // collapse duplicate virama+same consonant patterns e.g. న్ + న -> న్న (already correct)
  return out.replace(/్$/, "్");
}

export default toTelugu;
