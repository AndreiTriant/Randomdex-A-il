const cache = new Map();

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
