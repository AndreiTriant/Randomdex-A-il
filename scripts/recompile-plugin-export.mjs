import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { deflateSync, inflateSync } from "zlib";
import { join } from "path";

const game = join(import.meta.dirname, "../..");
const dest = join(game, "Data/PluginScripts.rxdata");
const src011 = join(game, "Plugins/Modo Random/011_ExportRandomizedData.rb");
const src001 = join(game, "Plugins/Randomized Data Export/001_Export.rb");

function readInt(buf, i) {
  const x = buf[i];
  if (x === 0) return [0, i + 1];
  if (x >= 6 && x <= 127) return [x - 5, i + 1];
  if (x >= 128 && x <= 250) return [x - 251, i + 1];
  const n = x <= 4 ? x : 256 - x;
  let v = 0;
  for (let k = 0; k < n; k++) v |= buf[i + 1 + k] << (8 * k);
  if (x > 4) {
    const bits = n * 8;
    if (v >= 1 << (bits - 1)) v -= 1 << bits;
  }
  return [v, i + 1 + n];
}

function writeInt(n) {
  if (n === 0) return Buffer.from([0]);
  if (n > 0 && n < 123) return Buffer.from([n + 5]);
  if (n < 0 && n > -124) return Buffer.from([(n - 5) & 0xff]);
  const bytes = [];
  let x = n;
  const neg = x < 0;
  if (neg) x = -x;
  while (x > 0) {
    bytes.push(x & 0xff);
    x >>= 8;
  }
  const len = bytes.length;
  const head = neg ? 256 - len : len;
  return Buffer.from([head, ...bytes]);
}

function parse(buf) {
  let i = 0;
  const objects = [];
  const symbols = [];
  if (buf[0] !== 4 || buf[1] !== 8) throw new Error("no es Marshal 4.8");
  i = 2;

  function one() {
    const t = buf[i++];
    if (t === 0x30) return null;
    if (t === 0x54) return true;
    if (t === 0x46) return false;
    if (t === 0x69) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      return n;
    }
    if (t === 0x22) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      const s = buf.slice(i, i + n);
      i += n;
      objects.push(s);
      return s;
    }
    if (t === 0x3a) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      const s = buf.slice(i, i + n).toString("utf8");
      i += n;
      symbols.push(s);
      return { __sym: s };
    }
    if (t === 0x3b) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      return { __sym: symbols[n] };
    }
    if (t === 0x40) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      return objects[n];
    }
    if (t === 0x5b) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      const arr = [];
      objects.push(arr);
      for (let k = 0; k < n; k++) arr.push(one());
      return arr;
    }
    if (t === 0x7b) {
      const [n, ni] = readInt(buf, i);
      i = ni;
      const obj = { __hash: true, pairs: [] };
      objects.push(obj);
      for (let k = 0; k < n; k++) obj.pairs.push([one(), one()]);
      return obj;
    }
    if (t === 0x49) {
      const inner = one();
      const [n, ni] = readInt(buf, i);
      i = ni;
      const ivars = [];
      for (let k = 0; k < n; k++) ivars.push([one(), one()]);
      const wrapped = { __ivar: true, value: inner, ivars };
      return wrapped;
    }
    throw new Error(`tipo marshal desconocido ${t} @${i - 1}`);
  }

  return one();
}

function dump(value) {
  const chunks = [Buffer.from([4, 8])];

  function int(n) {
    chunks.push(writeInt(n));
  }
  function put(v) {
    if (v === null || v === undefined) {
      chunks.push(Buffer.from([0x30]));
      return;
    }
    if (v === true) {
      chunks.push(Buffer.from([0x54]));
      return;
    }
    if (v === false) {
      chunks.push(Buffer.from([0x46]));
      return;
    }
    if (typeof v === "number") {
      chunks.push(Buffer.from([0x69]));
      int(v);
      return;
    }
    if (Buffer.isBuffer(v)) {
      chunks.push(Buffer.from([0x22]));
      int(v.length);
      chunks.push(v);
      return;
    }
    if (v && v.__sym) {
      const b = Buffer.from(v.__sym, "utf8");
      chunks.push(Buffer.from([0x3a]));
      int(b.length);
      chunks.push(b);
      return;
    }
    if (v && v.__ivar) {
      chunks.push(Buffer.from([0x49]));
      put(v.value);
      int(v.ivars.length);
      for (const [k, val] of v.ivars) {
        put(k);
        put(val);
      }
      return;
    }
    if (v && v.__hash) {
      chunks.push(Buffer.from([0x7b]));
      int(v.pairs.length);
      for (const [k, val] of v.pairs) {
        put(k);
        put(val);
      }
      return;
    }
    if (Array.isArray(v)) {
      chunks.push(Buffer.from([0x5b]));
      int(v.length);
      for (const x of v) put(x);
      return;
    }
    if (typeof v === "string") {
      const b = Buffer.from(v, "utf8");
      chunks.push(Buffer.from([0x22]));
      int(b.length);
      chunks.push(b);
      return;
    }
    throw new Error(`no se puede serializar ${v}`);
  }

  put(value);
  return Buffer.concat(chunks);
}

function textOf(v) {
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  if (v && v.__ivar) return textOf(v.value);
  if (typeof v === "string") return v;
  return "";
}

function pluginName(entry) {
  return textOf(entry[0]);
}

function fileName(pair) {
  return textOf(pair[0]);
}

const raw = readFileSync(dest);
const tree = parse(raw);
if (!Array.isArray(tree)) throw new Error("PluginScripts no es un array");

const replacements = [
  {
    plugin: "Random Pokemon & Moves + Randomizer EX (Abilities)",
    file: "011_ExportRandomizedData.rb",
    body: readFileSync(src011),
  },
  {
    plugin: "Randomized Data Export",
    file: "001_Export.rb",
    body: readFileSync(src001),
  },
];

let changed = 0;
for (const entry of tree) {
  const name = pluginName(entry);
  const files = entry[2];
  if (!Array.isArray(files)) continue;
  for (const pair of files) {
    const fname = fileName(pair);
    const hit = replacements.find((r) => r.plugin === name && r.file === fname);
    if (!hit) continue;
    pair[1] = deflateSync(hit.body);
    changed++;
    console.log(`actualizado ${name} / ${fname} (${hit.body.length} bytes)`);
  }
}

if (!changed) {
  console.log("plugins encontrados:");
  for (const entry of tree) {
    const files = (entry[2] || []).map(fileName).join(", ");
    console.log(`- ${pluginName(entry)} :: ${files}`);
  }
  throw new Error("no se encontró el script de export para parchear");
}

copyFileSync(dest, dest + ".bak");
writeFileSync(dest, dump(tree));

const check = parse(readFileSync(dest));
let ok = 0;
for (const entry of check) {
  for (const pair of entry[2] || []) {
    const fname = fileName(pair);
    if (!/ExportRandomizedData|001_Export\.rb/.test(fname)) continue;
    const src = inflateSync(pair[1]).toString("utf8");
    if (src.includes('"pickups"') && src.includes("collect_pickups")) ok++;
  }
}
console.log(`verificado: ${ok} scripts con pickups · PluginScripts actualizado`);
