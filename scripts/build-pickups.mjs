import { writeFileSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parsePbsSections } from "../src/data.js";

const root = join(import.meta.dirname, "../..");
const meta = parsePbsSections(readFileSync(join(root, "PBS/map_metadata.txt"), "utf8"));
const maps = {};
for (const { rawId, fields } of meta) {
  const id = Number(String(rawId).split(",")[0]);
  if (!id) continue;
  const pos = String(fields.MapPosition || "")
    .split(",")
    .map((s) => s.trim());
  maps[id] = {
    name: fields.Name || `Mapa ${id}`,
    region: pos.length >= 3 ? Number(pos[0]) : null,
    tx: pos.length >= 3 ? Number(pos[1]) : null,
    ty: pos.length >= 3 ? Number(pos[2]) : null,
  };
}

function countAll(text, needle) {
  let n = 0;
  let i = 0;
  while (true) {
    const p = text.indexOf(needle, i);
    if (p < 0) return n;
    n++;
    i = p + needle.length;
  }
}

function countNpcItems(text) {
  let n = 0;
  let i = 0;
  while (true) {
    const p = text.indexOf("pbReceiveItem", i);
    if (p < 0) return n;
    const before = text.slice(Math.max(0, p - 420), p);
    if (!/ha huido|nidoIncursion|CombateNido|ALBUMFOTOS|PartyPicture|Fot[oó]grafo/i.test(before)) n++;
    i = p + 13;
  }
}

const LEADERS = [
  "LIDER1HOENN",
  "LIDER2HOENN",
  "LIDER3HOENN",
  "LIDER4HOENN",
  "LIDER5HOENN",
  "LIDER6HOENN",
  "LIDER7HOENN",
  "LIDER8HOENN",
];

const dir = join(root, "Data");
const pkmnRx = /pbAddPokemonSilent|pbAddPokemon|pbGivePokemon|pbReceivePokemon/g;
const pickups = [];

for (const file of readdirSync(dir)) {
  if (!/^Map\d+\.rxdata$/i.test(file)) continue;
  const id = Number(file.match(/\d+/)[0]);
  const text = readFileSync(join(dir, file)).toString("latin1");
  const info = maps[id] || { name: `Mapa ${id}`, region: 0, tx: null, ty: null };
  const base = {
    map_id: id,
    map: info.name,
    taken: false,
    region: info.region ?? 0,
    tx: info.tx,
    ty: info.ty,
  };

  const balls = countAll(text, "pbItemBall");
  const npcItems = countNpcItems(text);
  const items = balls + npcItems;
  const pkmn = [...text.matchAll(pkmnRx)].length;
  const nests = countAll(text, "CombateNido");
  const leaders = LEADERS.filter((k) => text.includes(k)).length;

  if (items) {
    pickups.push({
      ...base,
      id: `${id}-item`,
      name: "Objetos",
      kinds: ["item"],
      count: items,
    });
  }
  if (pkmn) {
    pickups.push({
      ...base,
      id: `${id}-pokemon`,
      name: "Pokémon",
      kinds: ["pokemon"],
      count: pkmn,
    });
  }
  if (nests) {
    pickups.push({
      ...base,
      id: `${id}-nest`,
      name: "Nido Alfa",
      kinds: ["nest"],
      count: nests,
    });
  }
  if (leaders) {
    pickups.push({
      ...base,
      id: `${id}-leader`,
      name: "Líder exótico",
      kinds: ["leader"],
      count: leaders,
    });
  }
}

writeFileSync(join(import.meta.dirname, "../src/pickups.json"), JSON.stringify(pickups, null, 2));
const placed = pickups.filter((p) => p.tx != null && p.region === 0);
const byKind = pickups.reduce((acc, p) => {
  for (const k of p.kinds) acc[k] = (acc[k] || 0) + (p.count || 1);
  return acc;
}, {});
console.log(
  `filas ${pickups.length} · kanto ${placed.length} · ${JSON.stringify(byKind)}`
);
