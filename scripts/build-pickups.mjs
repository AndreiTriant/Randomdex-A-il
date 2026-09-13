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

const dir = join(root, "Data");
const itemRx = /pbItemBall|pbReceiveItem|pbHiddenItem/g;
const pkmnRx = /pbAddPokemonSilent|pbAddPokemon|pbGivePokemon|pbStartTrade|pbReceivePokemon/g;
const pickups = [];
for (const file of readdirSync(dir)) {
  if (!/^Map\d+\.rxdata$/i.test(file)) continue;
  const id = Number(file.match(/\d+/)[0]);
  const text = readFileSync(join(dir, file)).toString("latin1");
  const items = [...text.matchAll(itemRx)].length;
  const pkmn = [...text.matchAll(pkmnRx)].length;
  if (!items && !pkmn) continue;
  const info = maps[id] || { name: `Mapa ${id}`, region: 0, tx: null, ty: null };
  const kinds = [];
  if (items) kinds.push("item");
  if (pkmn) kinds.push("pokemon");
  pickups.push({
    id: String(id),
    map_id: id,
    map: info.name,
    kinds,
    count: items + pkmn,
    taken: false,
    region: info.region ?? 0,
    tx: info.tx,
    ty: info.ty,
  });
}

writeFileSync(join(import.meta.dirname, "../src/pickups.json"), JSON.stringify(pickups, null, 2));
const placed = pickups.filter((p) => p.tx != null && p.region === 0);
console.log(`total ${pickups.length} · kanto ${placed.length} · sin casilla ${pickups.filter((p) => p.tx == null).length}`);
