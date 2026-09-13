const cache = new Map();
const abilityCache = new Map();
let abilityIndex = null;

export async function fetchVanilla(slugOrList) {
  const trySlugs = Array.isArray(slugOrList) ? slugOrList : [slugOrList];
  for (const slug of trySlugs.filter(Boolean)) {
    if (cache.has(slug)) {
      const hit = cache.get(slug);
      if (hit) return hit;
      continue;
    }
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      if (!res.ok) {
        cache.set(slug, null);
        continue;
      }
      const json = await res.json();
      const stats = {};
      for (const st of json.stats) stats[st.stat.name] = st.base_stat;
      const art =
        json.sprites?.other?.["official-artwork"]?.front_default ||
        json.sprites?.other?.home?.front_default ||
        json.sprites?.front_default;
      const pixel = json.sprites?.front_default;
      const result = {
        id: json.id,
        name: json.name,
        slug,
        stats,
        sprite: art,
        pixel,
        types: json.types.map((t) => t.type.name),
      };
      cache.set(slug, result);
      return result;
    } catch {
      cache.set(slug, null);
    }
  }
  return null;
}

async function loadAbilityIndex() {
  if (abilityIndex) return abilityIndex;
  const res = await fetch("https://pokeapi.co/api/v2/ability?limit=2000");
  if (!res.ok) throw new Error("ability index");
  const json = await res.json();
  abilityIndex = new Map();
  for (const row of json.results || []) {
    abilityIndex.set(row.name.replace(/-/g, "").toUpperCase(), row.name);
  }
  return abilityIndex;
}

export async function fetchAbility(id) {
  const key = String(id || "").toUpperCase();
  if (!key) return null;
  if (abilityCache.has(key)) return abilityCache.get(key);
  try {
    const index = await loadAbilityIndex();
    const slug = index.get(key);
    if (!slug) {
      abilityCache.set(key, null);
      return null;
    }
    const res = await fetch(`https://pokeapi.co/api/v2/ability/${slug}`);
    if (!res.ok) {
      abilityCache.set(key, null);
      return null;
    }
    const json = await res.json();
    const texts = json.flavor_text_entries || [];
    const es = [...texts].reverse().find((e) => e.language?.name === "es");
    const en = [...texts].reverse().find((e) => e.language?.name === "en");
    const description = String(es?.flavor_text || en?.flavor_text || "")
      .replace(/\s+/g, " ")
      .trim();
    const result = description ? { id: key, description } : null;
    abilityCache.set(key, result);
    return result;
  } catch {
    abilityCache.set(key, null);
    return null;
  }
}
