/** PBS BaseStats order in Essentials: HP, Atk, Def, Speed, SpAtk, SpDef */
export const STATS = [
  { key: "hp", label: "HP", pbsIndex: 0, api: "hp" },
  { key: "atk", label: "Ataque", pbsIndex: 1, api: "attack" },
  { key: "def", label: "Defensa", pbsIndex: 2, api: "defense" },
  { key: "spa", label: "At. Esp.", pbsIndex: 4, api: "special-attack" },
  { key: "spd", label: "Def. Esp.", pbsIndex: 5, api: "special-defense" },
  { key: "spe", label: "Velocidad", pbsIndex: 3, api: "speed" },
];

export const TYPE_COLORS = {
  NORMAL: "#A8A77A",
  FIRE: "#EE8130",
  WATER: "#6390F0",
  ELECTRIC: "#F7D02C",
  GRASS: "#7AC74C",
  ICE: "#96D9D6",
  FIGHTING: "#C22E28",
  POISON: "#A33EA1",
  GROUND: "#E2BF65",
  FLYING: "#A98FF3",
  PSYCHIC: "#F95587",
  BUG: "#A6B91A",
  ROCK: "#B6A136",
  GHOST: "#735797",
  DRAGON: "#6F35FC",
  DARK: "#705746",
  STEEL: "#B7B7CE",
  FAIRY: "#D685AD",
  QMARKS: "#68A090",
};

const DEFAULT_TYPES = {
  NORMAL: { name: "Normal", weaknesses: ["FIGHTING"], resistances: [], immunities: ["GHOST"] },
  FIGHTING: { name: "Lucha", weaknesses: ["FLYING", "PSYCHIC", "FAIRY"], resistances: ["ROCK", "BUG", "DARK"], immunities: [] },
  FLYING: { name: "Volador", weaknesses: ["ROCK", "ELECTRIC", "ICE"], resistances: ["FIGHTING", "BUG", "GRASS"], immunities: ["GROUND"] },
  POISON: { name: "Veneno", weaknesses: ["GROUND", "PSYCHIC"], resistances: ["FIGHTING", "POISON", "BUG", "GRASS", "FAIRY"], immunities: [] },
  GROUND: { name: "Tierra", weaknesses: ["WATER", "GRASS", "ICE"], resistances: ["POISON", "ROCK"], immunities: ["ELECTRIC"] },
  ROCK: { name: "Roca", weaknesses: ["FIGHTING", "GROUND", "STEEL", "WATER", "GRASS"], resistances: ["NORMAL", "FLYING", "POISON", "FIRE"], immunities: [] },
  BUG: { name: "Bicho", weaknesses: ["FLYING", "ROCK", "FIRE"], resistances: ["FIGHTING", "GROUND", "GRASS"], immunities: [] },
  GHOST: { name: "Fantasma", weaknesses: ["GHOST", "DARK"], resistances: ["POISON", "BUG"], immunities: ["NORMAL", "FIGHTING"] },
  STEEL: { name: "Acero", weaknesses: ["FIGHTING", "GROUND", "FIRE"], resistances: ["NORMAL", "FLYING", "ROCK", "BUG", "STEEL", "GRASS", "PSYCHIC", "ICE", "DRAGON", "FAIRY"], immunities: ["POISON"] },
  FIRE: { name: "Fuego", weaknesses: ["GROUND", "ROCK", "WATER"], resistances: ["BUG", "STEEL", "FIRE", "GRASS", "ICE", "FAIRY"], immunities: [] },
  WATER: { name: "Agua", weaknesses: ["GRASS", "ELECTRIC"], resistances: ["STEEL", "FIRE", "WATER", "ICE"], immunities: [] },
  GRASS: { name: "Planta", weaknesses: ["FLYING", "POISON", "BUG", "FIRE", "ICE"], resistances: ["GROUND", "WATER", "GRASS", "ELECTRIC"], immunities: [] },
  ELECTRIC: { name: "Eléctrico", weaknesses: ["GROUND"], resistances: ["FLYING", "STEEL", "ELECTRIC"], immunities: [] },
  PSYCHIC: { name: "Psíquico", weaknesses: ["BUG", "GHOST", "DARK"], resistances: ["FIGHTING", "PSYCHIC"], immunities: [] },
  ICE: { name: "Hielo", weaknesses: ["FIGHTING", "ROCK", "STEEL", "FIRE"], resistances: ["ICE"], immunities: [] },
  DRAGON: { name: "Dragón", weaknesses: ["ICE", "DRAGON", "FAIRY"], resistances: ["FIRE", "WATER", "GRASS", "ELECTRIC"], immunities: [] },
  DARK: { name: "Siniestro", weaknesses: ["FIGHTING", "BUG", "FAIRY"], resistances: ["GHOST", "DARK"], immunities: ["PSYCHIC"] },
  FAIRY: { name: "Hada", weaknesses: ["POISON", "STEEL"], resistances: ["FIGHTING", "BUG", "DARK"], immunities: ["DRAGON"] },
};

const EVO_LABELS = {
  Level: (p) => `Nv. ${p}`,
  LevelMale: (p) => `Nv. ${p} ♂`,
  LevelFemale: (p) => `Nv. ${p} ♀`,
  LevelDay: (p) => `Nv. ${p} (día)`,
  LevelNight: (p) => `Nv. ${p} (noche)`,
  LevelMorning: (p) => `Nv. ${p} (mañana)`,
  LevelAfternoon: (p) => `Nv. ${p} (tarde)`,
  LevelRain: (p) => `Nv. ${p} (lluvia)`,
  AttackGreater: (p) => `Nv. ${p} (Atq > Def)`,
  AtkDefEqual: (p) => `Nv. ${p} (Atq = Def)`,
  DefenseGreater: (p) => `Nv. ${p} (Def > Atq)`,
  Item: (p) => `Objeto ${prettyId(p)}`,
  ItemMale: (p) => `Objeto ${prettyId(p)} ♂`,
  ItemFemale: (p) => `Objeto ${prettyId(p)} ♀`,
  ItemDay: (p) => `Objeto ${prettyId(p)} (día)`,
  ItemNight: (p) => `Objeto ${prettyId(p)} (noche)`,
  Trade: () => "Intercambio",
  TradeItem: (p) => `Intercambio (${prettyId(p)})`,
  TradeSpecies: (p) => `Intercambio por ${prettyId(p)}`,
  Happiness: () => "Amistad",
  HappinessMale: () => "Amistad ♂",
  HappinessFemale: () => "Amistad ♀",
  HappinessDay: () => "Amistad (día)",
  HappinessNight: () => "Amistad (noche)",
  HappinessMove: (p) => `Amistad + ${prettyId(p)}`,
  HappinessMoveType: (p) => `Amistad + tipo ${prettyId(p)}`,
  HoldItem: (p) => `Equipado ${prettyId(p)}`,
  HoldItemMale: (p) => `Equipado ${prettyId(p)} ♂`,
  HoldItemFemale: (p) => `Equipado ${prettyId(p)} ♀`,
  DayHoldItem: (p) => `Equipado ${prettyId(p)} (día)`,
  NightHoldItem: (p) => `Equipado ${prettyId(p)} (noche)`,
  HasMove: (p) => `Conoce ${prettyId(p)}`,
  HasMoveType: (p) => `Mov. tipo ${prettyId(p)}`,
  HasInParty: (p) => `Con ${prettyId(p)} en el equipo`,
  Location: (p) => `Lugar ${prettyId(p)}`,
  LocationFlag: (p) => prettyId(p),
  Region: (p) => `Región ${prettyId(p)}`,
  Beauty: (p) => `Belleza ${p}`,
  None: () => "Especial",
  Mega: () => "Mega",
};

export function prettyId(id) {
  if (id == null || id === "") return "";
  return String(id)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parsePbsSections(text) {
  const sections = [];
  const chunks = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n#-+[^\n]*/);
  for (const chunk of chunks) {
    const header = chunk.match(/\[([^\]]+)\]/);
    if (!header) continue;
    const rawId = header[1].trim();
    const fields = {};
    for (const line of chunk.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || line.startsWith("[")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      fields[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
    sections.push({ rawId, fields });
  }
  return sections;
}

function csv(value) {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseId(rawId) {
  const parts = rawId.split(",").map((s) => s.trim());
  if (parts.length === 1) return { id: parts[0], species: parts[0], form: 0 };
  return { id: `${parts[0]}_${parts[1]}`, species: parts[0], form: Number(parts[1]) || 0 };
}

function parseEvolutions(value) {
  const parts = csv(value);
  const evos = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (!parts[i] || !parts[i + 1]) continue;
    evos.push({
      to: parts[i],
      method: parts[i + 1],
      param: parts[i + 2] ?? "",
    });
  }
  return evos;
}

function parseStats(value) {
  const n = csv(value).map((x) => Number(x) || 0);
  const out = {};
  for (const s of STATS) out[s.key] = n[s.pbsIndex] ?? 0;
  return out;
}

function isMegaForm(fields) {
  if (fields.MegaStone) return true;
  return /mega/i.test(fields.FormName || "");
}

export function listMegas(pbsById, species) {
  return Object.values(pbsById).filter((e) => e.species === species && e.isMega);
}

export function listForms(pbsById, species) {
  const key = baseSpeciesId(species);
  return Object.values(pbsById)
    .filter((e) => baseSpeciesId(e.species || e.id) === key)
    .sort((a, b) => (a.form || 0) - (b.form || 0) || String(a.id).localeCompare(String(b.id)));
}

export function formLabel(entry) {
  if (entry?.formName) return entry.formName;
  if (entry?.isMega) return "Mega";
  return "Forma base";
}

export function baseSpeciesId(id = "") {
  return String(id).split("_")[0].toUpperCase();
}

/** NPC trades from map events (pbChoosePokemonForTradePC / pbStartTradePC). */
const IN_GAME_TRADES = [
  { give: "KADABRA", place: "Ruta 2 Norte" },
  { give: "METAPOD", place: "el Centro Pokémon de Ciudad Plateada" },
  { give: "HERACROSS", place: "Ciudad Azulona" },
  { give: "SPEAROW", place: "Ciudad Carmín" },
  { give: "GRAVELER", place: "Ruta 10" },
  { give: "NINETALES", place: "la Cafetería de Ciudad Celeste" },
  { give: "SEEL", place: "la Cafetería de Ciudad Celeste" },
  { give: "STARMIE", place: "la Cafetería de Ciudad Celeste" },
  { give: "BELLOSSOM", place: "la Cafetería de Ciudad Celeste" },
  { give: "RAPIDASH", place: "la Cafetería de Ciudad Celeste" },
  { give: "VILEPLUME", place: "la Cafetería de Ciudad Celeste" },
  { give: "HYPNO", place: "el Centro Comercial de Ciudad Azulona" },
  { give: "KANGASKHAN", place: "el Laboratorio de Isla Canela" },
  { give: "MUK", place: "el Laboratorio de Isla Canela" },
  { give: "HYPNO", place: "el Laboratorio de Isla Canela" },
  { give: "WEEZING", place: "el Laboratorio de Isla Canela" },
  { give: "MAROWAK", place: "el Laboratorio de Isla Canela" },
  { give: "PINSIR", place: "el Laboratorio de Isla Canela" },
  { give: "LANTURN", place: "la Zona Safari" },
  { give: "MAGMORTAR", place: "la Zona Safari" },
  { give: "HOUNDOOM", place: "la Zona Safari" },
  { give: "ARCANINE", place: "la Zona Safari" },
  { give: "VICTREEBEL", place: "la Zona Safari" },
  { give: "SEAKING", place: "la Zona Safari" },
  { give: "POLITOED", place: "la Zona Safari" },
  { give: "JUMPLUFF", place: "la Zona Safari" },
  { give: "EXEGGUTOR", place: "la Zona Safari" },
  { give: "FORRETRESS", place: "Ruta 23" },
  { give: "MACHAMP", place: "el Hostal de Ciudad Añil" },
  { give: "DUGTRIO", place: "el Hostal de Ciudad Añil" },
  { give: "FARIGIRAF", place: "el Hostal de Ciudad Añil" },
  { give: "HONCHKROW", place: "el Hostal de Ciudad Añil" },
  { give: "HERACROSS", place: "el Hostal de Ciudad Añil" },
  { give: "CHANSEY", place: "el Hostal de Ciudad Añil" },
];

export function tradesForOwned(ownedId, pbsById = {}) {
  const owned = baseSpeciesId(ownedId);
  if (!owned) return [];
  const later = laterEvolutions(owned, pbsById);
  const hits = [];
  const seen = new Set();
  for (const row of IN_GAME_TRADES) {
    const want = baseSpeciesId(row.give);
    let via = null;
    if (want === owned) via = "exact";
    else if (later.has(want)) via = "prevo";
    else continue;
    const key = `${want}|${row.place}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      give: want,
      place: row.place,
      via,
      name: pbsById[want]?.name || prettyId(want),
    });
  }
  return hits;
}

function laterEvolutions(species, pbsById) {
  const out = new Set();
  const stack = [baseSpeciesId(species)];
  const seen = new Set();
  const entries = Object.values(pbsById);
  while (stack.length) {
    const cur = stack.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const entry of entries) {
      if (entry.isMega) continue;
      if (baseSpeciesId(entry.species || entry.id) !== cur) continue;
      for (const ev of entry.evolutions || []) {
        const to = baseSpeciesId(ev.to);
        if (!to || seen.has(to) || to === cur) continue;
        if (pbsById[to]?.isMega) continue;
        out.add(to);
        stack.push(to);
      }
    }
  }
  return out;
}

export function tradeTooltip(trades) {
  if (!trades?.length) return "";
  const lines = trades.map((t) => {
    if (t.via === "prevo") {
      return `Hay que intercambiar a ${t.name} en ${t.place}.`;
    }
    return `Pokémon intercambiable en ${t.place}.`;
  });
  return [...new Set(lines)].join(" ");
}

export function fromApiStats(api) {
  if (!api) return null;
  const out = {};
  for (const s of STATS) out[s.key] = api[s.api] ?? 0;
  return out;
}

export function parsePokemonPbs(text, formsText = "") {
  const byId = {};
  let dex = 0;
  for (const { rawId, fields } of parsePbsSections(text)) {
    const { id, species, form } = parseId(rawId);
    if (form === 0) dex += 1;
    byId[id] = {
      id,
      species,
      form,
      dex: form === 0 ? dex : null,
      name: fields.Name || prettyId(species),
      formName: fields.FormName || "",
      megaStone: fields.MegaStone || "",
      region: fields.Region || "",
      isMega: isMegaForm(fields),
      types: csv(fields.Types),
      stats: parseStats(fields.BaseStats),
      evolutions: parseEvolutions(fields.Evolutions),
      tutorMoves: csv(fields.TutorMoves),
      eggMoves: csv(fields.EggMoves),
    };
  }
  if (formsText) {
    for (const { rawId, fields } of parsePbsSections(formsText)) {
      const { id, species, form } = parseId(rawId);
      const base = byId[species] || {};
      byId[id] = {
        id,
        species,
        form,
        dex: base.dex ?? null,
        name: fields.Name || base.name || prettyId(species),
        formName: fields.FormName || "",
        megaStone: fields.MegaStone || "",
        region: fields.Region || base.region || "",
        isMega: isMegaForm(fields),
        types: fields.Types ? csv(fields.Types) : [...(base.types || [])],
        stats: fields.BaseStats ? parseStats(fields.BaseStats) : { ...(base.stats || {}) },
        evolutions: fields.Evolutions ? parseEvolutions(fields.Evolutions) : [...(base.evolutions || [])],
        tutorMoves: fields.TutorMoves ? csv(fields.TutorMoves) : [...(base.tutorMoves || [])],
        eggMoves: fields.EggMoves ? csv(fields.EggMoves) : [...(base.eggMoves || [])],
      };
    }
  }
  const dexOf = {};
  for (const e of Object.values(byId)) {
    if (e.form === 0 && e.dex) dexOf[e.species] = e.dex;
  }
  for (const e of Object.values(byId)) {
    if (!e.dex) e.dex = dexOf[e.species] || null;
  }
  return byId;
}

export function parseMovesPbs(text) {
  const moves = {};
  for (const { rawId, fields } of parsePbsSections(text)) {
    moves[rawId] = {
      id: rawId,
      name: fields.Name || prettyId(rawId),
      type: fields.Type || "NORMAL",
      category: fields.Category || "",
      power: Number(fields.Power) || 0,
      accuracy: Number(fields.Accuracy) || 0,
      pp: Number(fields.TotalPP) || 0,
      description: fields.Description || "",
    };
  }
  return moves;
}

export function parseAbilitiesPbs(text) {
  const abilities = {};
  for (const { rawId, fields } of parsePbsSections(text)) {
    abilities[rawId] = {
      id: rawId,
      name: fields.Name || prettyId(rawId),
      description: fields.Description || "",
    };
  }
  return abilities;
}

export function abilityInfo(abilitiesMap, ability) {
  if (!ability?.id || !abilitiesMap) return null;
  return abilitiesMap[ability.id] || abilitiesMap[String(ability.id).toUpperCase()] || null;
}

export function parseTypesPbs(text) {
  if (!text) return structuredClone(DEFAULT_TYPES);
  const types = {};
  for (const { rawId, fields } of parsePbsSections(text)) {
    if (fields.IsPseudoType === "true") continue;
    types[rawId] = {
      name: fields.Name || prettyId(rawId),
      weaknesses: csv(fields.Weaknesses),
      resistances: csv(fields.Resistances),
      immunities: csv(fields.Immunities),
    };
  }
  return Object.keys(types).length ? types : structuredClone(DEFAULT_TYPES);
}

export function parseItemsPbs(text) {
  const machines = [];
  for (const { rawId, fields } of parsePbsSections(text)) {
    const use = String(fields.FieldUse || "").toUpperCase();
    if (use !== "TM" && use !== "HM") continue;
    machines.push({
      id: rawId,
      name: fields.Name || rawId,
      kind: use === "HM" ? "MO" : "MT",
      move: fields.Move || "",
      move_name: "",
    });
  }
  return machines;
}

export function listTmsForSpecies(rnd = {}, pbs = {}, randomRoot = {}, items = []) {
  if (Array.isArray(rnd.random_tms) && rnd.random_tms.length) {
    return { tms: rnd.random_tms, source: "export" };
  }
  const map = randomRoot.tm_move_map || {};
  const catalog = [];
  const seen = new Set();
  const push = (tm) => {
    const id = String(tm?.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    const mapped = map[id] || map[id.toUpperCase()];
    catalog.push({
      id,
      name: tm.name && tm.name !== id ? tm.name : id.replace(/^TM/i, "MT").replace(/^HM/i, "MO"),
      kind: tm.kind || "MT",
      move: String(mapped?.id || tm.move || ""),
      move_name: mapped?.name || tm.move_name || "",
    });
  };
  for (const tm of randomRoot.tms || []) push(tm);
  for (const tm of items || []) push(tm);
  for (const [id, mv] of Object.entries(map)) {
    push({ id, name: id, move: mv?.id, move_name: mv?.name });
  }
  const can = new Set();
  const add = (x) => {
    if (x) can.add(String(x).toUpperCase());
  };
  for (const m of pbs.tutorMoves || []) add(m);
  for (const m of pbs.eggMoves || []) add(m);
  for (const m of rnd.original_moves || []) add(m.move);
  for (const m of rnd.random_moves || []) add(m.move);
  const tms = catalog
    .filter((tm) => can.has(String(tm.move).toUpperCase()))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  return { tms, source: tms.length ? "inferred" : "none" };
}

export function parseRandomJson(data) {
  if (!data || typeof data !== "object" || !data.species) {
    throw new Error("El JSON no tiene la clave species.");
  }
  return data;
}

export function typeName(typesMap, id) {
  return typesMap[id]?.name || prettyId(id);
}

export function typeColor(id) {
  return TYPE_COLORS[id] || "#8899aa";
}

function multiplierVs(defenderType, attackType, typesMap) {
  const def = typesMap[defenderType];
  if (!def) return 1;
  if (def.immunities.includes(attackType)) return 0;
  if (def.weaknesses.includes(attackType)) return 2;
  if (def.resistances.includes(attackType)) return 0.5;
  return 1;
}

export function matchups(defTypes, typesMap) {
  const attackTypes = Object.keys(typesMap);
  const weak = [];
  const resist = [];
  const immune = [];
  for (const atk of attackTypes) {
    const mult = defTypes.reduce((m, d) => m * multiplierVs(d, atk, typesMap), 1);
    const row = { id: atk, name: typeName(typesMap, atk), mult };
    if (mult === 0) immune.push(row);
    else if (mult > 1) weak.push(row);
    else if (mult < 1) resist.push(row);
  }
  weak.sort((a, b) => b.mult - a.mult);
  resist.sort((a, b) => a.mult - b.mult);
  return { weak, resist, immune };
}

export function evoLabel(method, param) {
  const fn = EVO_LABELS[method];
  return fn ? fn(param) : prettyId(method) + (param ? ` ${prettyId(param)}` : "");
}

export function buildEvolutionFamily(pbsById, speciesKey) {
  const entries = Object.values(pbsById);
  const forwards = {};
  const backwards = {};
  for (const e of entries) {
    if (!e.evolutions?.length) continue;
    forwards[e.id] = e.evolutions.map((ev) => ({
      from: e.id,
      to: ev.to,
      method: ev.method,
      param: ev.param,
    }));
    for (const ev of e.evolutions) {
      (backwards[ev.to] ||= []).push(e.id);
    }
  }

  const visited = new Set();
  const rootWalk = (id) => {
    const prev = backwards[id];
    if (!prev?.length) return id;
    return rootWalk(prev[0]);
  };
  const base = pbsById[speciesKey];
  if (!base) return [];
  const root = rootWalk(base.form === 0 ? base.species : base.id) || base.species;

  const stages = [];
  const queue = [{ id: root, depth: 0, via: null }];
  while (queue.length) {
    const node = queue.shift();
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    (stages[node.depth] ||= []).push(node);
    for (const ev of forwards[node.id] || []) {
      queue.push({ id: ev.to, depth: node.depth + 1, via: ev });
    }
  }
  return stages;
}

export function normalizeAbility(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { id: entry, name: prettyId(entry) };
  return { id: entry.id || "", name: entry.name || prettyId(entry.id) };
}

export function normalizeMove(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { level: 0, move: entry, name: prettyId(entry) };
  return {
    level: Number(entry.level) || 0,
    move: entry.move || "",
    name: entry.name || prettyId(entry.move),
  };
}

const API_ALIASES = {
  NIDORANF: "nidoran-f",
  NIDORANM: "nidoran-m",
  FARFETCHD: "farfetchd",
  SIRFETCHD: "sirfetchd",
  MRMIME: "mr-mime",
  MRRIME: "mr-rime",
  MIMEJR: "mime-jr",
  TYPENULL: "type-null",
  HOOH: "ho-oh",
  PORYGONZ: "porygon-z",
  JANGMOO: "jangmo-o",
  HAKAMOO: "hakamo-o",
  KOMMOO: "kommo-o",
  FLABEBE: "flabebe",
  WOOPER_1: "wooper-paldea",
};

const API_FORM_DEFAULTS = {
  aegislash: ["aegislash-shield", "aegislash-blade"],
  deoxys: ["deoxys-normal", "deoxys-attack", "deoxys-defense", "deoxys-speed"],
  giratina: ["giratina-altered", "giratina-origin"],
  shaymin: ["shaymin-land", "shaymin-sky"],
  tornadus: ["tornadus-incarnate", "tornadus-therian"],
  thundurus: ["thundurus-incarnate", "thundurus-therian"],
  landorus: ["landorus-incarnate", "landorus-therian"],
  enamorus: ["enamorus-incarnate", "enamorus-therian"],
  keldeo: ["keldeo-ordinary", "keldeo-resolute"],
  meloetta: ["meloetta-aria", "meloetta-pirouette"],
  darmanitan: ["darmanitan-standard", "darmanitan-zen"],
  wormadam: ["wormadam-plant", "wormadam-sandy", "wormadam-trash"],
  basculin: ["basculin-red-striped", "basculin-blue-striped", "basculin-white-striped"],
  meowstic: ["meowstic-male", "meowstic-female"],
  indeedee: ["indeedee-male", "indeedee-female"],
  basculegion: ["basculegion-male", "basculegion-female"],
  oinkologne: ["oinkologne-male", "oinkologne-female"],
  lycanroc: ["lycanroc-midday", "lycanroc-midnight", "lycanroc-dusk"],
  wishiwashi: ["wishiwashi-solo", "wishiwashi-school"],
  oricorio: ["oricorio-baile", "oricorio-pom-pom", "oricorio-pau", "oricorio-sensu"],
  mimikyu: ["mimikyu-disguised", "mimikyu-busted"],
  minior: ["minior-red-meteor", "minior-red"],
  toxtricity: ["toxtricity-amped", "toxtricity-low-key"],
  eiscue: ["eiscue-ice", "eiscue-noice"],
  morpeko: ["morpeko-full-belly", "morpeko-hangry"],
  urshifu: ["urshifu-single-strike", "urshifu-rapid-strike"],
  zygarde: ["zygarde-50", "zygarde-10", "zygarde-complete"],
  pumpkaboo: ["pumpkaboo-average", "pumpkaboo-small", "pumpkaboo-large", "pumpkaboo-super"],
  gourgeist: ["gourgeist-average", "gourgeist-small", "gourgeist-large", "gourgeist-super"],
};

const API_FORM_BY_INDEX = {
  LYCANROC: ["lycanroc-midday", "lycanroc-midnight", "lycanroc-dusk"],
  MINIOR: {
    0: "minior-red-meteor",
    7: "minior-red",
    8: "minior-orange",
    9: "minior-yellow",
    10: "minior-green",
    11: "minior-blue",
    12: "minior-indigo",
    13: "minior-violet",
  },
};

function formApiSuffix(formName = "") {
  const f = formName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const rules = [
    ["mega-x", /mega.?x\b/],
    ["mega-y", /mega.?y\b/],
    ["mega", /\bmega\b/],
    ["alola", /alola/],
    ["galar", /galar/],
    ["hisui", /hisui/],
    ["paldea", /paldea/],
    ["shield", /escudo|shield/],
    ["blade", /filo|blade/],
    ["attack", /ataque|\battack\b/],
    ["defense", /defensa|\bdefense\b/],
    ["speed", /velocidad|\bspeed\b/],
    ["origin", /origen|\borigin\b/],
    ["altered", /modificad|\baltered\b/],
    ["sky", /cielo|\bsky\b/],
    ["land", /tierra|\bland\b/],
    ["therian", /therian/],
    ["incarnate", /avatar|incarnate/],
    ["zen", /\bzen\b/],
    ["resolute", /resolut/],
    ["pirouette", /pirueta|pirouette/],
    ["aria", /\baria\b|lirica/],
    ["midday", /diurn[oa]|midday/],
    ["midnight", /nocturn[oa]|midnight/],
    ["red", /nucleo rojo/],
    ["orange", /nucleo naranja/],
    ["yellow", /nucleo amarillo/],
    ["green", /nucleo verde/],
    ["blue", /nucleo azul/],
    ["indigo", /nucleo (anil|indigo)/],
    ["violet", /nucleo violeta/],
    ["meteor", /meteorito|meteor/],
    ["dusk", /crepuscular|\bdusk\b/],
    ["school", /banco|school/],
    ["solo", /\bsolo\b/],
    ["small", /peque|\bsmall\b/],
    ["large", /grande|\blarge\b/],
    ["super", /extra.?grande|\bsuper\b/],
    ["average", /tamano normal|\baverage\b/],
    ["amped", /aguda|\bamped\b/],
    ["low-key", /grave|low-key/],
    ["ice", /hielo|\bice\b/],
    ["noice", /descongel|noice/],
    ["male", /macho|\bmale\b/],
    ["female", /hembra|\bfemale\b/],
    ["10", /10\s*%/],
    ["50", /50\s*%/],
    ["complete", /complet/],
    ["disguised", /encubiert|disguised/],
    ["busted", /descubiert|busted/],
    ["single-strike", /estilo fuerte|single.strike/],
    ["rapid-strike", /estilo fluido|rapid.strike/],
  ];
  for (const [suf, re] of rules) {
    if (re.test(f)) return suf;
  }
  return "";
}

export function speciesLabel(pbs = {}, rnd = {}) {
  return rnd.name || pbs.name || prettyId(pbs.species || pbs.id || "");
}

export function apiSlug(speciesId, form = 0, extra = {}) {
  const slugs = apiSlugs({ id: speciesId, species: String(speciesId).split("_")[0], form, ...extra });
  return slugs[0];
}

export function apiSlugs(pbs = {}) {
  const speciesId = pbs.id || pbs.species || "";
  const baseRaw = String(pbs.species || String(speciesId).split("_")[0] || "")
    .toLowerCase()
    .replace(/_/g, "-");
  const base = API_ALIASES[String(pbs.species || speciesId.split("_")[0] || "").toUpperCase()] || baseRaw;
  const formName = pbs.formName || "";
  const stone = pbs.megaStone || "";
  const region = pbs.region || "";
  const slugs = [];
  const suffix = formApiSuffix(formName);
  const speciesKey = String(pbs.species || String(speciesId).split("_")[0] || "").toUpperCase();
  const byIndex = API_FORM_BY_INDEX[speciesKey];
  const indexed =
    byIndex &&
    (Array.isArray(byIndex) ? byIndex[pbs.form || 0] : byIndex[pbs.form || 0]);
  if (indexed) slugs.push(indexed);

  if (pbs.isMega || /mega/i.test(formName) || stone) {
    const blob = `${formName} ${stone}`.toLowerCase();
    if (/\bx\b/.test(blob) || /x$/.test(stone.toLowerCase())) {
      slugs.push(`${base}-mega-x`, `${base}-mega`);
    } else if (/\by\b/.test(blob) || /y$/.test(stone.toLowerCase())) {
      slugs.push(`${base}-mega-y`, `${base}-mega`);
    } else {
      slugs.push(`${base}-mega`, `${base}-mega-x`, `${base}-mega-y`);
    }
  } else if (suffix) {
    slugs.push(`${base}-${suffix}`);
  } else if (/alola/i.test(region)) {
    slugs.push(`${base}-alola`);
  } else if (/galar/i.test(region)) {
    slugs.push(`${base}-galar`);
  } else if (/hisui/i.test(region)) {
    slugs.push(`${base}-hisui`);
  } else if (/paldea/i.test(region)) {
    slugs.push(`${base}-paldea`);
  }

  if (API_ALIASES[speciesId]) slugs.unshift(API_ALIASES[speciesId]);
  slugs.push(...(API_FORM_DEFAULTS[base] || []));
  slugs.push(base);
  return [...new Set(slugs.filter(Boolean))];
}

export function searchList(pbsById, randomSpecies) {
  const keys = new Set([...Object.keys(pbsById), ...Object.keys(randomSpecies || {})]);
  const seen = new Set();
  return [...keys]
    .map((id) => {
      const pbs = pbsById[id];
      const rnd = randomSpecies?.[id];
      const species = pbs?.species || String(id).split("_")[0];
      const form = pbs?.form ?? (String(id).includes("_") ? 1 : 0);
      return {
        id: form === 0 ? species : id,
        species,
        form,
        name: pbs?.name || rnd?.name || prettyId(species),
        dex: form === 0 ? pbs?.dex : pbsById[species]?.dex || pbs?.dex,
        types: pbs?.types || [],
      };
    })
    .filter((p) => {
      if (p.form !== 0) return false;
      const key = String(p.species || p.id).toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.dex || 9999) - (b.dex || 9999) || a.name.localeCompare(b.name, "es"));
}

export const PICKUP_KINDS = [
  {
    id: "item",
    label: "Objetos",
    tone: "item",
    blurb: "Pokéballs del suelo y NPCs que dan un objeto.",
    taken: "Al recogerlos el pin pasa a × y la ficha sale tachada.",
  },
  {
    id: "pokemon",
    label: "Pokémon",
    tone: "pkmn",
    blurb: "NPCs que te dan un Pokémon. Los intercambios no cuentan.",
    taken: "Igual que los objetos: el pin pasa a × al recogerlos.",
  },
  {
    id: "nest",
    label: "Nidos Alfa",
    tone: "nest",
    blurb: "Nidos con un Pokémon fuerte. No son pokéballs.",
    taken: "El pin pasa a × al vaciar el nido. Puede volver con Cristal Prisma.",
  },
  {
    id: "leader",
    label: "Líderes exóticos",
    tone: "leader",
    blurb: "Líderes de Hoenn que dan combate (y a veces objeto).",
    taken: "El pin pasa a × al ganar el combate.",
  },
];

export function pickupKindLabel(kind) {
  return PICKUP_KINDS.find((k) => k.id === kind)?.label || "Objeto";
}

export function pickupTone(kinds = []) {
  const known = PICKUP_KINDS.map((k) => k.id).filter((id) => kinds.includes(id));
  if (known.length === 1) return PICKUP_KINDS.find((k) => k.id === known[0]).tone;
  if (known.length > 1) return "mix";
  return "item";
}

const TRADE_ONLY_MAPS = new Set([34, 36, 38, 50, 53, 61, 78, 148, 176, 180]);

export function isIgnoredPickup(p = {}) {
  const blob = `${p.name || ""} ${p.id || ""} ${(p.kinds || []).join(" ")}`;
  if (/fotograf|partypicture|albumfotos|pbStartTrade|TradePC|intercambi/i.test(blob)) {
    return true;
  }
  const kinds = p.kinds || [];
  if (TRADE_ONLY_MAPS.has(Number(p.map_id)) && kinds.includes("pokemon") && !kinds.includes("item")) {
    return true;
  }
  return false;
}

export function mergePickups(exported, defaults = []) {
  if (!exported?.length) return defaults;
  const hasNew = exported.some((p) =>
    (p.kinds || []).some((k) => k === "nest" || k === "leader")
  );
  if (hasNew) return exported;
  return [
    ...exported,
    ...defaults.filter((p) => (p.kinds || []).some((k) => k === "nest" || k === "leader")),
  ];
}

export function groupPickups(pickups = [], { remainingOnly = true, kinds = null } = {}) {
  const allow = kinds?.length ? new Set(kinds) : null;
  const rows = pickups.filter((p) => {
    if (isIgnoredPickup(p)) return false;
    if ((p.region ?? 0) !== 0) return false;
    if (p.tx == null || p.ty == null) return false;
    if (remainingOnly && p.taken) return false;
    if (allow && !(p.kinds || []).some((k) => allow.has(k))) return false;
    return true;
  });
  const groups = new Map();
  for (const p of rows) {
    const key = `${p.tx},${p.ty}`;
    if (!groups.has(key)) {
      groups.set(key, { tx: p.tx, ty: p.ty, items: [], count: 0, takenCount: 0 });
    }
    const g = groups.get(key);
    g.items.push(p);
    const n = Number(p.count) || 1;
    g.count += n;
    if (p.taken) g.takenCount += n;
  }
  return [...groups.values()].map((g) => ({
    ...g,
    tone: pickupTone(g.items.flatMap((i) => i.kinds || [])),
    allTaken: g.takenCount > 0 && g.takenCount === g.count,
  }));
}
