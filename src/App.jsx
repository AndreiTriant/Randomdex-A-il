import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAbility, fetchVanilla } from "./api";
import {
  clearCachedFiles,
  formatSavedAt,
  loadCachedFiles,
  saveCachedFiles,
  writeSavedSelected,
} from "./cache";
import {
  speciesLabel,
  STATS,
  apiSlugs,
  buildEvolutionFamily,
  evoLabel,
  fromApiStats,
  listMegas,
  listForms,
  formLabel,
  matchups,
  normalizeAbility,
  normalizeMove,
  parseMovesPbs,
  parsePokemonPbs,
  parseRandomJson,
  parseTypesPbs,
  parseItemsPbs,
  parseAbilitiesPbs,
  abilityInfo,
  listTmsForSpecies,
  searchList,
  groupPickups,
  mergePickups,
  isIgnoredPickup,
  pickupKindLabel,
  PICKUP_KINDS,
  tradesForOwned,
  tradeTooltip,
  typeColor,
  typeName,
} from "./data";
import defaultPickups from "./pickups.json";

const SHOW_SEARCH = import.meta.env.VITE_SHOW_SEARCH === "true";

const FILES = [
  {
    key: "random",
    required: true,
    title: "JSON del random",
    accept: ".json,application/json",
    file: "randomized_data.json",
    hint: "C:\\Users\\User\\AppData\\Roaming\\Pokemon Anil\\randomized_data.json",
    why: "Habilidades, movimientos y MTs randomizadas de tu partida.",
  },
  {
    key: "pokemon",
    required: true,
    title: "PBS de especies",
    accept: ".txt,text/plain",
    file: "pokemon.txt",
    hint: "Pokemon Anil V4.13\\PBS\\pokemon.txt",
    why: "Stats, tipos y evoluciones de Añil.",
  },
  {
    key: "forms",
    required: false,
    title: "Formas alternativas",
    accept: ".txt,text/plain",
    file: "pokemon_forms.txt",
    hint: "Pokemon Anil V4.13\\PBS\\pokemon_forms.txt",
    why: "Megas, regionales y otras formas. Opcional.",
  },
  {
    key: "moves",
    required: false,
    title: "PBS de movimientos",
    accept: ".txt,text/plain",
    file: "moves.txt",
    hint: "Pokemon Anil V4.13\\PBS\\moves.txt",
    why: "Tipo, potencia y descripción de cada ataque. Opcional.",
  },
  {
    key: "types",
    required: false,
    title: "PBS de tipos",
    accept: ".txt,text/plain",
    file: "types.txt",
    hint: "Pokemon Anil V4.13\\PBS\\types.txt",
    why: "Si no lo subes, usamos la tabla de tipos de Añil incluida.",
  },
  {
    key: "items",
    required: false,
    title: "PBS de objetos",
    accept: ".txt,text/plain",
    file: "items.txt",
    hint: "Pokemon Anil V4.13\\PBS\\items.txt",
    why: "Catálogo de MTs/MOs. Si no lo subes, usamos las MTs que salgan en el JSON.",
  },
  {
    key: "abilities",
    required: false,
    title: "PBS de habilidades",
    accept: ".txt,text/plain",
    file: "abilities.txt",
    hint: "Pokemon Anil V4.13\\PBS\\abilities.txt",
    why: "Descripciones al pasar el cursor. Opcional.",
  },
];

function fileBasename(file) {
  const raw = file?.webkitRelativePath || file?.name || "";
  return raw.split(/[\\/]/).pop().toLowerCase().replace(/\s+/g, "");
}

function identifyFile(file) {
  const name = fileBasename(file);
  if (!name) return null;
  if (name === "randomized_data.json" || name === "randomized_abilities.json") return "random";
  if (name.endsWith(".json") && (name.includes("randomized_data") || name.includes("randomized_abilities"))) {
    return "random";
  }
  if (name === "pokemon_forms.txt" || name === "pokemonforms.txt") return "forms";
  if (name === "pokemon.txt") return "pokemon";
  if (name === "moves.txt") return "moves";
  if (name === "types.txt") return "types";
  if (name === "items.txt") return "items";
  if (name === "abilities.txt") return "abilities";
  return null;
}

function readHash() {
  const raw = (window.location.hash || "").replace(/^#\/?/, "");
  const [head, ...rest] = raw.split("/").filter(Boolean);
  if (head === "p" && rest[0]) {
    return { view: "pokemon", id: decodeURIComponent(rest.join("/")) };
  }
  if (head === "cambiados") return { view: "cambiados", id: "" };
  if (head === "mapa") return { view: "mapa", id: "" };
  return { view: "equipo", id: "" };
}

function writeHash(view, id) {
  let next = "#/equipo";
  if (view === "pokemon" && id) next = `#/p/${encodeURIComponent(id)}`;
  else if (view === "cambiados") next = "#/cambiados";
  else if (view === "mapa") next = "#/mapa";
  if ((window.location.hash || "") !== next) window.location.hash = next;
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file, "UTF-8");
  });
}

function walkEntry(entry) {
  if (!entry) return Promise.resolve([]);
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file((file) => resolve([file]), reject);
    });
  }
  if (!entry.isDirectory) return Promise.resolve([]);
  const reader = entry.createReader();
  return new Promise((resolve, reject) => {
    const entries = [];
    const read = () => {
      reader.readEntries(async (batch) => {
        if (!batch.length) {
          const nested = await Promise.all(entries.map(walkEntry));
          resolve(nested.flat());
          return;
        }
        entries.push(...batch);
        read();
      }, reject);
    };
    read();
  });
}

async function filesFromDrop(dataTransfer) {
  const items = Array.from(dataTransfer.items || []);
  if (items.some((item) => item.webkitGetAsEntry)) {
    const nested = await Promise.all(
      items.map((item) => walkEntry(item.webkitGetAsEntry?.()))
    );
    const files = nested.flat();
    if (files.length) return files;
  }
  return Array.from(dataTransfer.files || []);
}

async function readEntry(entry) {
  if (!entry) return "";
  if (entry instanceof Blob) return readFile(entry);
  if (typeof entry.text === "string") return entry.text;
  return "";
}

function buildDataset(texts) {
  const random = parseRandomJson(JSON.parse(texts.random.text));
  const pbs = parsePokemonPbs(texts.pokemon.text, texts.forms?.text || "");
  const moves = parseMovesPbs(texts.moves?.text || "");
  const types = parseTypesPbs(texts.types?.text || "");
  const items = parseItemsPbs(texts.items?.text || "");
  const abilities = parseAbilitiesPbs(texts.abilities?.text || "");
  return { random, pbs, moves, types, items, abilities, meta: random };
}

function SearchBox({ dataset, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const list = useMemo(
    () => searchList(dataset.pbs, dataset.random?.species),
    [dataset]
  );
  const hits = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return list
      .filter((p) => {
        const hay = `${p.name} ${p.id} ${p.dex ?? ""}`.toLowerCase();
        return hay.includes(n);
      })
      .slice(0, 14);
  }, [list, q]);

  useEffect(() => {
    function onDoc(e) {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function choose(id) {
    onPick(id);
    setQ("");
    setOpen(false);
  }

  return (
    <div className="search" ref={boxRef}>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQ("");
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            choose(hits[active].id);
          }
        }}
        placeholder="Buscar Pokémon…"
        aria-label="Buscar Pokémon"
        autoComplete="off"
      />
      {q ? (
        <button type="button" className="search-clear" onClick={() => setQ("")} aria-label="Limpiar búsqueda">
          ×
        </button>
      ) : null}
      {open && q.trim() ? (
        <ul className="search-pop">
          {hits.length === 0 ? (
            <li>
              <span className="search-empty">Sin resultados</span>
            </li>
          ) : (
            hits.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={i === active ? "on" : ""}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(p.id)}
                >
                  <span className="dexn">{p.dex ? String(p.dex).padStart(3, "0") : "—"}</span>
                  <span>{p.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState("");
  const [cacheNote, setCacheNote] = useState("");
  const [hydrating, setHydrating] = useState(true);
  const [cached, setCached] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const hash0 = readHash();
  const [view, setView] = useState(hash0.view);
  const [selected, setSelected] = useState(hash0.id || "");
  const [tab, setTab] = useState("info");

  function openCambiados() {
    setSelected("");
    setView("cambiados");
    writeHash("cambiados");
  }

  function openMapa() {
    setSelected("");
    setView("mapa");
    writeHash("mapa");
  }

  function openEquipo() {
    setSelected("");
    setView("equipo");
    writeHash("equipo");
  }

  function openPokemon(id) {
    setSelected(id);
    setView("pokemon");
    setTab("info");
    writeHash("pokemon", id);
  }

  async function applyTexts(texts, { persist, resetView = true } = {}) {
    if (!texts?.random?.text || !texts?.pokemon?.text) {
      setError("Faltan archivos obligatorios: JSON del random y pokemon.txt.");
      return false;
    }
    const built = buildDataset(texts);
    setDataset({
      random: built.random,
      pbs: built.pbs,
      moves: built.moves,
      types: built.types,
      items: built.items,
      abilities: built.abilities,
      meta: built.random,
    });
    if (resetView) {
      setSelected("");
      setView("equipo");
      writeHash("equipo");
      writeSavedSelected("");
    }
    if (persist) {
      try {
        await saveCachedFiles(texts);
        setCacheNote("");
      } catch (e) {
        setCacheNote(
          e?.name === "QuotaExceededError"
            ? "El atlas se abrió, pero no cupo en la caché del navegador."
            : "El atlas se abrió, pero no se pudo guardar en este navegador."
        );
      }
    }
    return true;
  }

  async function onLoad(files) {
    setError("");
    try {
      const texts = {};
      for (const spec of FILES) {
        if (!files[spec.key]) continue;
        texts[spec.key] = {
          name: files[spec.key].name || spec.file,
          text: await readEntry(files[spec.key]),
        };
      }
      await applyTexts(texts, { persist: true });
      setCached(texts);
      setShowUpload(false);
    } catch (e) {
      setError(e.message || "No se pudieron leer los archivos.");
    }
  }

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const loaded = await loadCachedFiles();
        if (!live) return;
        setCached(loaded);
        if (loaded?.random?.text && loaded?.pokemon?.text) {
          await applyTexts(loaded, { persist: false, resetView: false });
        }
      } catch (e) {
        if (live) {
          setError(e.message || "No se pudo leer la caché del navegador.");
          setShowUpload(true);
        }
      } finally {
        if (live) setHydrating(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (dataset) writeSavedSelected(selected || "");
  }, [dataset, selected]);

  useEffect(() => {
    function onHash() {
      const h = readHash();
      setView(h.view);
      setSelected(h.view === "pokemon" ? h.id : "");
      if (h.view === "pokemon") setTab("info");
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (hydrating) {
    return (
      <div className="boot">
        <div className="boot-glow" />
        <section className="boot-card">
          <p className="eyebrow">Random Atlas</p>
          <h1>Cargando…</h1>
          <p className="lede">Comprobando si hay datos guardados en este navegador.</p>
        </section>
      </div>
    );
  }

  const hasCache = !!(cached?.random?.text && cached?.pokemon?.text);

  if (!dataset) {
    return (
      <UploadScreen
        onLoad={onLoad}
        error={error}
        initialCached={cached}
        onBack={
          hasCache
            ? async () => {
                setShowUpload(false);
                setError("");
                try {
                  await applyTexts(cached, { persist: false, resetView: false });
                } catch (e) {
                  setError(e.message || "No se pudieron leer los datos guardados.");
                  setShowUpload(true);
                }
              }
            : null
        }
        onCacheCleared={() => {
          setCached({});
          setShowUpload(true);
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="brand"
          title="Volver al equipo y cajas"
          onClick={openEquipo}
        >
          <span className="brand-mark">Æ</span>
          <div>
            <p className="brand-kicker">Pokémon Añil</p>
            <h1>Random Atlas</h1>
          </div>
        </button>
        {SHOW_SEARCH && <SearchBox dataset={dataset} onPick={openPokemon} />}
        <div className="top-actions">
          <button
            type="button"
            className={`ghost ${view === "equipo" ? "on" : ""}`}
            onClick={openEquipo}
          >
            Equipo y cajas
          </button>
          <button
            type="button"
            className={`ghost ${view === "cambiados" ? "on" : ""}`}
            onClick={openCambiados}
          >
            Stats cambiadas
          </button>
          <button
            type="button"
            className={`ghost ${view === "mapa" ? "on" : ""}`}
            onClick={openMapa}
          >
            Mapa
          </button>
          <button
            className="ghost"
            onClick={() => {
              setDataset(null);
              setShowUpload(true);
            }}
          >
            Cambiar archivos
          </button>
        </div>
      </header>
      {cacheNote && <p className="cache-banner">{cacheNote}</p>}
      {view === "pokemon" && selected ? (
        <PokemonPage
          id={selected}
          dataset={dataset}
          tab={tab}
          setTab={setTab}
          onPick={openPokemon}
        />
      ) : view === "mapa" ? (
        <MapPage dataset={dataset} />
      ) : (
        <OwnedPage
          dataset={dataset}
          onPick={openPokemon}
          mode={view === "equipo" ? "all" : "changed"}
          onMode={(next) => (next === "all" ? openEquipo() : openCambiados())}
        />
      )}
    </div>
  );
}

function cacheStamp(cached) {
  return Object.values(cached || {}).reduce((max, row) => Math.max(max, row.savedAt || 0), 0);
}

function UploadScreen({ onLoad, error, initialCached = {}, onBack, onCacheCleared }) {
  const [picked, setPicked] = useState(() => ({ ...initialCached }));
  const [unknown, setUnknown] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [savedAt, setSavedAt] = useState(() => cacheStamp(initialCached));
  const folderRef = useRef(null);

  function ingest(fileList) {
    const next = { ...picked };
    const skipped = [];
    for (const file of Array.from(fileList || [])) {
      const key = identifyFile(file);
      if (key) next[key] = file;
      else {
        const name = fileBasename(file);
        if (/move|pokemon|type|form|random|\.json$/.test(name)) skipped.push(file.name);
      }
    }
    setPicked(next);
    setUnknown(Array.from(fileList || []).length <= 12 ? skipped : []);
  }

  function removeKey(key) {
    setPicked((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  async function wipeCache() {
    await clearCachedFiles();
    setPicked({});
    setSavedAt(0);
    onCacheCleared?.();
  }

  const ready = FILES.filter((f) => f.required).every((f) => picked[f.key]);
  const cachedLabel = formatSavedAt(savedAt);

  return (
    <div className="boot">
      <div className="boot-glow" />
      <section className="boot-card">
        <p className="eyebrow">Carga tu semilla</p>
        <h1>Atlas de tu partida random</h1>
        <p className="lede">
          Arrastra o elige varios archivos a la vez. El atlas los reconoce por el
          nombre y los guarda en este navegador. Puedes sustituir solo el JSON si
          regeneras el random. El <code>randomized_abilities_status.txt</code> no
          hace falta.
        </p>
        {cachedLabel && (
          <p className="cache-hint">Los archivos en caché ya están listos; suelta encima los que quieras cambiar.</p>
        )}
        <label
          className={`dropzone ${dragging ? "dragging" : ""} ${ready ? "ready" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setDragging(false);
            ingest(await filesFromDrop(e.dataTransfer));
          }}
        >
          <input
            type="file"
            multiple
            accept=".json,.txt,application/json,text/plain"
            onChange={(e) => {
              ingest(e.target.files);
              e.target.value = "";
            }}
          />
          <strong>Suelta aquí pokemon.txt, moves.txt, el JSON o la carpeta PBS</strong>
          <span>o haz clic para elegir varios archivos de una vez</span>
        </label>
        <input
          ref={folderRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          className="visually-hidden"
          onChange={(e) => {
            ingest(e.target.files);
            e.target.value = "";
          }}
        />
        <button type="button" className="ghost folder-btn" onClick={() => folderRef.current?.click()}>
          Elegir carpeta PBS
        </button>
        <ul className="file-status">
          {FILES.map((f) => {
            const entry = picked[f.key];
            const cached = entry && !(entry instanceof Blob);
            return (
              <li key={f.key} className={entry ? "ok" : f.required ? "missing" : "wait"}>
                <div>
                  <span>{f.required ? "Obligatorio" : "Opcional"}</span>
                  <strong>{f.title}</strong>
                  <code>{entry?.name || f.file}</code>
                </div>
                {entry ? (
                  <span className="file-tag">
                    <em>{cached ? "En caché" : "Nuevo"}</em>
                    <button type="button" className="ghost tiny" onClick={() => removeKey(f.key)}>
                      Quitar
                    </button>
                  </span>
                ) : (
                  <em>{f.required ? "Falta" : "Sin subir"}</em>
                )}
              </li>
            );
          })}
        </ul>
        {unknown.length > 0 && (
          <p className="warn">
            No reconocí: {unknown.join(", ")}. Usa nombres como{" "}
            <code>moves.txt</code> o <code>pokemon_forms.txt</code>.
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="boot-actions">
          <button className="primary" disabled={!ready} onClick={() => onLoad(picked)}>
            Abrir atlas
          </button>
          {onBack && (
            <button type="button" className="ghost" onClick={onBack}>
              Volver
            </button>
          )}
          {savedAt > 0 && (
            <button type="button" className="ghost" onClick={wipeCache}>
              Borrar datos de este navegador
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

const TOWN_COLS = 30;
const TOWN_ROWS = 20;
const PIN_NUDGE = {
  item: [0, 0],
  pokemon: [0.32, 0],
  nest: [-0.32, 0],
  leader: [0, 0.38],
};

function MapPage({ dataset }) {
  const exported = dataset.random?.pickups;
  const pickups = useMemo(
    () => mergePickups(exported, defaultPickups).filter((p) => !isIgnoredPickup(p)),
    [exported]
  );
  const [remainingOnly, setRemainingOnly] = useState(false);
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(PICKUP_KINDS.map((k) => [k.id, true]))
  );
  const [active, setActive] = useState(null);

  const kinds = PICKUP_KINDS.filter((k) => visible[k.id]).map((k) => k.id);
  const hasTakenMarks = (pickups || []).some((p) => p.taken);

  const groups = useMemo(
    () => groupPickups(pickups || [], { remainingOnly, kinds }),
    [pickups, remainingOnly, visible]
  );

  const total = (pickups || []).reduce((n, p) => n + (Number(p.count) || 1), 0);
  const left = (pickups || [])
    .filter((p) => !p.taken && (p.region ?? 0) === 0)
    .reduce((n, p) => n + (Number(p.count) || 1), 0);
  const done = total - left;

  function toggleKind(id) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="map-page">
      <header className="owned-page-head">
        <h2>Mapa de recogidas</h2>
        <p>
          El pin sólido es pendiente. El pin apagado con × ya está hecho. El
          objeto concreto da igual: se marca el evento.
        </p>
      </header>
      {!pickups.length ? (
        <p className="muted">No hay eventos de recogida con casilla en el mapa.</p>
      ) : (
        <>
          <div className="map-toolbar">
            <p className="map-count">
              {hasTakenMarks
                ? `${left} pendientes · ${done} hechos · ${total} eventos`
                : `${total} eventos · todavía no hay ninguno marcado como hecho`}
            </p>
            <label className="map-remain">
              <input
                type="checkbox"
                checked={remainingOnly}
                onChange={(e) => setRemainingOnly(e.target.checked)}
              />
              Ocultar los hechos
            </label>
          </div>
          {!hasTakenMarks ? (
            <p className="map-warn">
              Tu JSON no trae lo recogido, por eso nada sale tachado. Cierra Añil,
              ábrelo manteniendo Ctrl, guarda la partida y vuelve a cargar
              randomized_data.json.
            </p>
          ) : null}
          <div className="map-state-legend" aria-hidden="true">
            <span>
              <i className="map-swatch item" /> Pendiente
            </span>
            <span>
              <i className="map-swatch item is-taken" /> Hecho
            </span>
          </div>
          <ul className="map-legend">
            {PICKUP_KINDS.map((k) => (
              <li key={k.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visible[k.id]}
                    onChange={() => toggleKind(k.id)}
                  />
                  <span className={`map-swatch ${k.tone}`} aria-hidden="true" />
                  <span>
                    <strong>{k.label}</strong>
                    <em>{k.blurb}</em>
                    <em className="map-taken-note">{k.taken}</em>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="town-map">
            <img src="/mapRegion0.png" alt="Mapa de Kanto en Añil" />
            {groups.map((g) => {
              const key = `${g.tx},${g.ty},${g.kind}`;
              const nudge = PIN_NUDGE[g.kind] || [0, 0];
              return (
                <button
                  key={key}
                  type="button"
                  className={`map-pin ${g.tone} ${g.allTaken ? "is-taken" : ""} ${active === key ? "on" : ""}`}
                  style={{
                    left: `${((g.tx + 0.5 + nudge[0]) / TOWN_COLS) * 100}%`,
                    top: `${((g.ty + 0.5 + nudge[1]) / TOWN_ROWS) * 100}%`,
                  }}
                  onClick={() => setActive(active === key ? null : key)}
                >
                  {g.allTaken ? "×" : g.count}
                </button>
              );
            })}
          </div>
          {active && (
            <ul className="map-spot">
              {groups
                .find((g) => `${g.tx},${g.ty},${g.kind}` === active)
                ?.items.map((ev) => (
                  <li key={ev.id} className={ev.taken ? "is-taken" : ""}>
                    <strong>{ev.map || `Mapa ${ev.map_id}`}</strong>
                    <span>
                      {(ev.kinds || []).map(pickupKindLabel).join(" · ")}
                      {ev.name ? ` · ${ev.name}` : ""}
                      {ev.taken ? " · Hecho" : " · Pendiente"}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function OwnedPage({ dataset, onPick, mode, onMode }) {
  const party = dataset.random?.owned?.party;
  const boxes = dataset.random?.owned?.boxes;
  const all = useMemo(
    () => [
      ...(party || []).map((p) => ({ ...p, group: "party" })),
      ...(boxes || []).map((p) => ({ ...p, group: "box" })),
    ],
    [party, boxes]
  );
  const [roster, setRoster] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    if (!all.length) {
      setRoster([]);
      setReady(true);
      return undefined;
    }
    setReady(false);
    (async () => {
      const vanillaByKey = new Map();
      const unique = [];
      for (const mon of all) {
        const pbs = dataset.pbs[mon.id] || dataset.pbs[mon.species];
        if (!pbs) continue;
        const key = pbs.id || mon.id || mon.species;
        if (!vanillaByKey.has(key)) {
          vanillaByKey.set(key, null);
          unique.push({ key, pbs });
        }
      }
      await Promise.all(
        unique.map(async ({ key, pbs }) => {
          vanillaByKey.set(key, await fetchVanilla(apiSlugs(pbs)));
        })
      );
      if (!live) return;
      const hits = [];
      for (const mon of all) {
        const pbs = dataset.pbs[mon.id] || dataset.pbs[mon.species] || {};
        const key = pbs.id || mon.id || mon.species;
        const vanilla = vanillaByKey.get(key);
        const official = fromApiStats(vanilla?.stats);
        const diffs = pbs.stats && official
          ? STATS.map((s) => {
              const anil = pbs.stats[s.key] || 0;
              const off = official[s.key] || 0;
              return { ...s, anil, off, delta: anil - off };
            })
              .filter((s) => s.delta !== 0)
              .sort((a, b) => b.delta - a.delta)
          : [];
        hits.push({
          ...mon,
          pbsId: pbs.id || mon.id || mon.species,
          speciesName: speciesLabel(pbs) || mon.species_name,
          formName: pbs.formName || "",
          name: mon.nickname || mon.species_name || speciesLabel(pbs),
          types: pbs.types || [],
          sprite: vanilla?.sprite || vanilla?.pixel || "",
          diffs,
          upCount: diffs.filter((s) => s.delta > 0).length,
          anilSum: pbs.stats ? statTotal(pbs.stats) : 0,
          offSum: official ? statTotal(official) : 0,
          compared: !!(pbs.stats && official),
          hasMega: listMegas(dataset.pbs, pbs.species || mon.species).length > 0,
          tradePlaces: tradesForOwned(pbs.species || mon.species || mon.id, dataset.pbs),
        });
      }
      if (live) {
        setRoster(hits);
        setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [all, dataset.pbs]);

  const changed = useMemo(() => {
    const hits = roster.filter((m) => m.diffs.length);
    return [...hits].sort((a, b) => {
      if (b.upCount !== a.upCount) return b.upCount - a.upCount;
      const d = b.anilSum - b.offSum - (a.anilSum - a.offSum);
      if (d) return d;
      return (a.name || "").localeCompare(b.name || "", "es");
    });
  }, [roster]);

  const shown = mode === "changed" ? changed : roster;
  const partyHits = shown.filter((m) => m.group === "party");
  const boxHits = shown.filter((m) => m.group === "box");

  return (
    <main className="owned-page">
      <header className="owned-page-head">
        <p className="eyebrow">Equipo y cajas</p>
        <h2>{mode === "changed" ? "Stats distintas a las oficiales" : "Todos tus Pokémon"}</h2>
        <p>
          {mode === "changed"
            ? "Solo los que tienes cuya especie en Añil no coincide con las stats base oficiales."
            : "Todo el equipo y el PC de la partida. Pulsa una carta para abrir la ficha."}
        </p>
      </header>
      <nav className="tabs">
        <button type="button" className={mode === "all" ? "on" : ""} onClick={() => onMode("all")}>
          Todos ({roster.length})
        </button>
        <button
          type="button"
          className={mode === "changed" ? "on" : ""}
          onClick={() => onMode("changed")}
        >
          Stats cambiadas ({changed.length})
        </button>
      </nav>
      {!all.length ? (
        <p className="muted">
          Este JSON aún no trae tu equipo ni las cajas. Cierra el juego, carga la
          partida y vuelve a subir <code>randomized_data.json</code>.
        </p>
      ) : !ready ? (
        <p className="muted">Cargando tu equipo y cajas…</p>
      ) : shown.length === 0 ? (
        <p className="muted">
          {mode === "changed"
            ? "Ninguno de los que tienes tiene las stats base cambiadas."
            : "No hay Pokémon en el equipo ni en las cajas."}
        </p>
      ) : (
        <>
          {partyHits.length > 0 && (
            <OwnedCardGrid
              title="Equipo"
              mons={partyHits}
              typesMap={dataset.types}
              onPick={onPick}
              showStats={mode === "changed"}
            />
          )}
          {boxHits.length > 0 && (
            <OwnedCardGrid
              title="Cajas"
              mons={boxHits}
              typesMap={dataset.types}
              onPick={onPick}
              showStats={mode === "changed"}
            />
          )}
        </>
      )}
    </main>
  );
}

function SpeciesMarks({ hasMega, tradePlaces }) {
  if (!hasMega && !tradePlaces?.length) return null;
  return (
    <span className="owned-marks">
      {hasMega && (
        <span className="owned-mark mega">
          Mega
          <em>Este Pokémon puede megaevolucionar.</em>
        </span>
      )}
      {tradePlaces?.length > 0 && (
        <span className="owned-mark trade">
          Intercambio
          <em>{tradeTooltip(tradePlaces)}</em>
        </span>
      )}
    </span>
  );
}

function OwnedCardGrid({ title, mons, typesMap, onPick, showStats = false }) {
  return (
    <section className="owned-group">
      <h3>{title}</h3>
      <ul className={`owned-grid ${showStats ? "" : "simple"}`}>
        {mons.map((mon, i) => {
          const bstDelta = mon.anilSum - mon.offSum;
          const hasDiffs = showStats && (mon.diffs || []).length > 0;
          const nickDiffers =
            mon.nickname &&
            mon.speciesName &&
            mon.nickname.toLowerCase() !== mon.speciesName.toLowerCase();
          return (
            <li key={`${mon.group}-${mon.place}-${mon.slot}-${mon.id}-${i}`}>
              <button
                type="button"
                className={`owned-card ${hasDiffs && bstDelta > 0 ? "gain" : ""} ${hasDiffs && bstDelta < 0 ? "loss" : ""} ${mon.fainted ? "fainted" : ""}`}
                onClick={() => onPick(mon.pbsId)}
              >
                <div className="owned-card-top">
                  {mon.sprite ? (
                    <img src={mon.sprite} alt="" />
                  ) : (
                    <div className="owned-ph">{(mon.name || "?").slice(0, 1)}</div>
                  )}
                  <div className="owned-card-meta">
                    <div className="owned-card-head">
                      <span className="owned-place">
                        <span className="owned-place-label">{mon.place || title}</span>
                        <em>{mon.place || title}</em>
                      </span>
                      <SpeciesMarks hasMega={mon.hasMega} tradePlaces={mon.tradePlaces} />
                    </div>
                    <strong>
                      {mon.name}
                      {mon.shiny ? " ★" : ""}
                    </strong>
                    <span className="owned-sub">
                      {mon.formName ? `${mon.formName} · ` : nickDiffers ? `${mon.speciesName} · ` : ""}
                      Nv. {mon.level}
                      {mon.fainted ? <span className="owned-ko">Debilitado</span> : null}
                    </span>
                    <div className="type-row compact">
                      {mon.types.map((t) => (
                        <span key={t} className="type-chip" style={{ "--tc": typeColor(t) }}>
                          {typeName(typesMap, t)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {hasDiffs ? (
                  <>
                <div
                  className={`owned-swing ${bstDelta > 0 ? "up" : ""} ${bstDelta < 0 ? "down" : "flat"}`}
                  style={{ "--boost": Math.min(1, Math.abs(bstDelta) / 50) }}
                >
                  <div className="owned-swing-num from">
                    <span>Oficial</span>
                    <b>{mon.offSum}</b>
                  </div>
                  <div className="owned-swing-mid">
                    <span className="owned-chevron" aria-hidden="true" />
                    <strong>
                      {bstDelta > 0 ? "+" : ""}
                      {bstDelta}
                    </strong>
                    <span className="owned-pips" aria-label={`${mon.upCount} stats subidas`}>
                      {STATS.map((s) => {
                        const hit = mon.diffs.find((d) => d.key === s.key);
                        const kind = !hit ? "" : hit.delta > 0 ? "up" : "down";
                        return <i key={s.key} className={kind} />;
                      })}
                    </span>
                  </div>
                  <div className="owned-swing-num to">
                    <span>Añil</span>
                    <b>{mon.anilSum}</b>
                  </div>
                </div>
                <div className="owned-stats stats">
                  {mon.diffs.map((s) => {
                    const av = s.anil;
                    const vv = s.off;
                    const max = 180;
                    const minv = Math.min(av, vv);
                    const over = s.delta > 0;
                    return (
                      <div
                        key={s.key}
                        className={`stat changed ${over ? "up" : "down"}`}
                        title={`Oficial ${vv}  ·  Añil ${av}  (${over ? "+" : ""}${s.delta})`}
                      >
                        <span className="stat-name">{s.label}</span>
                        <div className="stat-track">
                          <div className="stat-base" style={{ width: `${(minv / max) * 100}%` }} />
                          {over ? (
                            <div
                              className="stat-delta up"
                              style={{
                                left: `${(vv / max) * 100}%`,
                                width: `${(s.delta / max) * 100}%`,
                              }}
                            />
                          ) : (
                            <div
                              className="stat-delta down"
                              style={{
                                left: `${(av / max) * 100}%`,
                                width: `${(-s.delta / max) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                        <span className={`stat-num ${over ? "up" : "down"}`}>{av}</span>
                        <em className="owned-delta">
                          {over ? "+" : ""}
                          {s.delta}
                        </em>
                      </div>
                    );
                  })}
                </div>
                  </>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PokemonPage({ id, dataset, tab, setTab, onPick }) {
  const pbs = dataset.pbs[id] || dataset.pbs[id.split("_")[0]] || {};
  const rnd = dataset.random.species?.[id] || dataset.random.species?.[pbs.species] || {};
  const slugs = apiSlugs(pbs);
  const megas = listMegas(dataset.pbs, pbs.species);
  const forms = listForms(dataset.pbs, pbs.species || id);
  const baseForm = dataset.pbs[pbs.species];
  const [vanilla, setVanilla] = useState(null);

  useEffect(() => {
    let live = true;
    setVanilla(null);
    fetchVanilla(slugs).then((v) => {
      if (live) setVanilla(v);
    });
    return () => {
      live = false;
    };
  }, [slugs.join("|")]);

  const name = speciesLabel(pbs, rnd) || id;
  const types = pbs.types || [];
  const glow = types.map(typeColor);
  const family = buildEvolutionFamily(dataset.pbs, pbs.species || id);
  const tradePlaces = tradesForOwned(pbs.species || id, dataset.pbs);

  return (
    <main className="stage">
      <section
        className="hero"
        style={{
          "--g1": glow[0] || "#f0b45a",
          "--g2": glow[1] || glow[0] || "#6ee7c5",
        }}
      >
        <div className="hero-meta">
          <div className="hero-meta-main">
            <span className="dex-pill">N.º {pbs.dex || vanilla?.id || "—"}</span>
            {pbs.isMega && <span className="mega-pill">Mega</span>}
            {pbs.formName && <span className="form-pill">{pbs.formName}</span>}
            {pbs.stats && <span className="bst-pill">BST {statTotal(pbs.stats)}</span>}
          </div>
          <SpeciesMarks hasMega={megas.length > 0} tradePlaces={tradePlaces} />
        </div>
        <h2>{name}</h2>
        <div className="type-row">
          {types.map((t) => (
            <span key={t} className="type-chip" style={{ "--tc": typeColor(t) }}>
              {typeName(dataset.types, t)}
            </span>
          ))}
        </div>
        {forms.length > 1 && (
          <div className="form-row">
            <span className="form-label">Forma</span>
            {forms.length > 8 ? (
              <select
                className="form-select"
                value={id}
                onChange={(e) => onPick(e.target.value)}
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {formLabel(f)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="form-chips">
                {forms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`mega-chip ${f.id === id ? "on" : ""}`}
                    onClick={() => onPick(f.id)}
                  >
                    {formLabel(f)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="art-wrap">
          {vanilla?.sprite ? (
            <img src={vanilla.sprite} alt={name} />
          ) : (
            <div className="art-fallback">{name.slice(0, 1)}</div>
          )}
        </div>
        <EvolutionRibbon stages={family} dataset={dataset} current={id} onPick={onPick} />
      </section>

      <section className="panel">
        <nav className="tabs">
          <button className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>
            Información
          </button>
          <button className={tab === "moves" ? "on" : ""} onClick={() => setTab("moves")}>
            Movimientos
          </button>
        </nav>
        {tab === "info" ? (
          <InfoTab
            pbs={pbs}
            rnd={rnd}
            vanilla={vanilla}
            typesMap={dataset.types}
            abilitiesMap={dataset.abilities}
            baseForm={baseForm}
          />
        ) : (
          <MovesTab
            key={id}
            rnd={rnd}
            pbs={pbs}
            randomRoot={dataset.random}
            items={dataset.items || []}
            movesMap={dataset.moves}
            typesMap={dataset.types}
          />
        )}
      </section>
    </main>
  );
}

function EvoSprite({ id, dataset }) {
  const pbs = dataset.pbs[id] || {};
  const slugs = apiSlugs(pbs);
  const [src, setSrc] = useState(
    !pbs.isMega && pbs.dex
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pbs.dex}.png`
      : ""
  );
  useEffect(() => {
    let live = true;
    fetchVanilla(slugs).then((v) => {
      if (!live) return;
      if (v?.pixel) setSrc(v.pixel);
      else if (v?.sprite) setSrc(v.sprite);
    });
    return () => {
      live = false;
    };
  }, [slugs.join("|")]);
  if (!src) return <span className="evo-ph">{(pbs.name || id).slice(0, 1)}</span>;
  return <img src={src} alt="" />;
}

function EvolutionRibbon({ stages, dataset, current, onPick }) {
  const empty =
    !stages.length || (stages.length === 1 && stages[0].length === 1 && !stages[0][0].via);
  if (empty) {
    return (
      <div className="evo-wrap">
        <p className="evo-kicker">Línea evolutiva</p>
        <p className="evo-empty">Este Pokémon no evoluciona.</p>
      </div>
    );
  }

  return (
    <div className="evo-wrap">
      <p className="evo-kicker">Línea evolutiva</p>
      <div className="evo">
        {stages.map((col, i) => (
          <div key={i} className="evo-stage">
            {i > 0 && (
              <div className="evo-bridge" aria-hidden="true">
                <span className="evo-line-bar" />
              </div>
            )}
            <div className="evo-col">
              {col.map((node) => {
                const entry = dataset.pbs[node.id] || {};
                const label = dataset.random.species?.[node.id]?.name || entry.name || node.id;
                const active = node.id === current;
                return (
                  <div key={node.id} className="evo-node">
                    {node.via && (
                      <span className="evo-via">{evoLabel(node.via.method, node.via.param)}</span>
                    )}
                    <button className={active ? "current" : ""} onClick={() => onPick(node.id)}>
                      <EvoSprite id={node.id} dataset={dataset} />
                      <strong>{label}</strong>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoTab({ pbs, rnd, vanilla, typesMap, abilitiesMap, baseForm }) {
  const origBase = (rnd.original_base || []).map(normalizeAbility).filter(Boolean);
  const origHidden = (rnd.original_hidden || []).map(normalizeAbility).filter(Boolean);
  const randBase = (rnd.random_base || []).map(normalizeAbility).filter(Boolean);
  const randHidden = (rnd.random_hidden || []).map(normalizeAbility).filter(Boolean);
  const ms = pbs.types?.length ? matchups(pbs.types, typesMap) : { weak: [], resist: [], immune: [] };
  const official = fromApiStats(vanilla?.stats);
  const isMega = !!pbs.isMega;
  const officialLooksBase = vanilla?.slug && !String(vanilla.slug).includes("mega");

  return (
    <div className="info">
      <Block title="Habilidades">
        <AbilityCompare original={origBase} random={randBase} abilitiesMap={abilitiesMap} />
      </Block>
      <Block title="Habilidad oculta">
        <AbilityCompare original={origHidden} random={randHidden} abilitiesMap={abilitiesMap} />
      </Block>
      {isMega && baseForm?.stats && (
        <Block
          title="Mega vs forma base (Añil)"
          extra={<span className="hint">Lo que gana o pierde esta mega respecto a {baseForm.name} en Añil</span>}
        >
          <StatBoard
            anil={pbs.stats}
            compare={baseForm.stats}
            tone="mega"
            fromLabel="Base Añil"
            toLabel="Mega Añil"
          />
        </Block>
      )}
      <Block
        title={isMega ? "Cambios de Añil vs mega oficial" : "Estadísticas"}
        extra={
          <span className="hint">
            {isMega
              ? "Verde/rojo: Añil comparado con la mega oficial, no con la forma base"
              : "Blanco = coinciden · Verde = Añil más alto · Rojo = Añil más bajo"}
          </span>
        }
      >
        {isMega && officialLooksBase && (
          <p className="muted">No se encontró una mega oficial equivalente; se omite esta comparación.</p>
        )}
        {!(isMega && officialLooksBase) && (
          <StatBoard
            anil={pbs.stats}
            compare={official}
            tone="anil"
            fromLabel={isMega ? "Mega oficial" : "Oficial"}
            toLabel="Añil"
          />
        )}
      </Block>
      <Block title="Debilidades">
        <TypeBadges rows={ms.weak} />
      </Block>
      <Block title="Resistencias">
        <TypeBadges rows={ms.resist} />
      </Block>
      <Block title="Inmunidades">
        <TypeBadges rows={ms.immune} empty="Ninguna" />
      </Block>
    </div>
  );
}

function AbilityPill({ ability, fallback, abilitiesMap, className }) {
  const shown = ability || fallback;
  const extra = abilityInfo(abilitiesMap, shown);
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    let live = true;
    if (extra?.description || !shown?.id) {
      setRemote(null);
      return undefined;
    }
    fetchAbility(shown.id).then((row) => {
      if (live) setRemote(row);
    });
    return () => {
      live = false;
    };
  }, [shown?.id, extra?.description]);

  const name = shown?.name || extra?.name || "—";
  const desc = extra?.description || remote?.description || "";
  const [open, setOpen] = useState(false);
  return (
    <span
      className={`pill ${className} ${desc ? "has-tip" : ""} ${open ? "is-open" : ""}`}
      tabIndex={desc ? 0 : undefined}
      onMouseEnter={() => {
        if (desc) setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        if (desc) setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {name}
      {desc ? <span className="ability-tip">{desc}</span> : null}
    </span>
  );
}

function AbilityCompare({ original, random, abilitiesMap }) {
  if (!original.length && !random.length) return <p className="muted">Sin datos</p>;
  const n = Math.max(original.length, random.length, 1);
  return (
    <div className="ability-grid">
      {Array.from({ length: n }).map((_, i) => {
        const a = original[i];
        const b = random[i];
        const changed = a && b && a.id !== b.id;
        return (
          <div key={i} className={`ability-pair ${changed ? "changed" : ""}`}>
            <AbilityPill ability={a} abilitiesMap={abilitiesMap} className="ghost" />
            <span className="arrow">→</span>
            <AbilityPill ability={b} fallback={a} abilitiesMap={abilitiesMap} className="hot" />
          </div>
        );
      })}
    </div>
  );
}

function statTotal(stats = {}) {
  return STATS.reduce((n, s) => n + (Number(stats[s.key]) || 0), 0);
}

function StatBoard({ anil = {}, compare, tone = "anil", fromLabel = "Oficial", toLabel = "Añil" }) {
  const anilSum = statTotal(anil);
  const cmpSum = compare ? statTotal(compare) : null;
  const sumOver = cmpSum != null && anilSum > cmpSum;
  const sumUnder = cmpSum != null && anilSum < cmpSum;
  const sumDelta = cmpSum != null ? anilSum - cmpSum : 0;
  return (
    <div className={`stats tone-${tone}`}>
      {STATS.map((s) => {
        const av = anil[s.key] || 0;
        const vv = compare ? compare[s.key] ?? null : null;
        const max = 180;
        const minv = vv == null ? av : Math.min(av, vv);
        const over = vv != null && av > vv;
        const under = vv != null && av < vv;
        const changed = over || under;
        const delta = changed ? av - vv : 0;
        const tip = changed
          ? `${fromLabel}: ${vv}  ·  ${toLabel}: ${av}  (${delta > 0 ? "+" : ""}${delta})`
          : "";
        return (
          <div key={s.key} className={`stat ${changed ? "changed" : ""}`}>
            <span className="stat-name">{s.label}</span>
            <div className="stat-track">
              <div className="stat-base" style={{ width: `${(minv / max) * 100}%` }} />
              {over && (
                <div
                  className="stat-delta up"
                  style={{
                    left: `${(vv / max) * 100}%`,
                    width: `${((av - vv) / max) * 100}%`,
                  }}
                />
              )}
              {under && (
                <div
                  className="stat-delta down"
                  style={{
                    left: `${(av / max) * 100}%`,
                    width: `${((vv - av) / max) * 100}%`,
                  }}
                />
              )}
            </div>
            <span className={`stat-num ${over ? "up" : ""} ${under ? "down" : ""}`}>{av}</span>
            {changed && <span className="stat-tip">{tip}</span>}
          </div>
        );
      })}
      <p className="stat-sum">
        Suma de stats: <strong>{anilSum}</strong>
        {cmpSum != null && (
          <span className={sumOver ? "up" : sumUnder ? "down" : ""}>
            {" "}
            ({fromLabel} {cmpSum}
            {sumDelta !== 0 ? ` ${sumDelta > 0 ? "+" : ""}${sumDelta}` : ""})
          </span>
        )}
      </p>
      {!compare && <p className="muted">Sin datos para comparar.</p>}
    </div>
  );
}

function CatIcon({ cat }) {
  if (cat === "physical") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4.8 13.2 12 4.8l7.2 8.4-2.4 6H7.2l-2.4-6Zm7.2-5.1-4.2 4.9.9 2.2h6.6l.9-2.2-4.2-4.9Z"
        />
      </svg>
    );
  }
  if (cat === "special") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3.5 13.8 9H19.5L15 12.4 16.8 18 12 14.8 7.2 18 9 12.4 4.5 9h5.7L12 3.5Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 2.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Zm-2.2 4.3h4.4v1.8h-4.4V10.5Z"
      />
    </svg>
  );
}

function moveCategory(extra) {
  if (!extra?.category) return null;
  const cat =
    extra.category === "Physical" ? "physical" : extra.category === "Special" ? "special" : "status";
  const label = cat === "physical" ? "Físico" : cat === "special" ? "Especial" : "Estado";
  return { cat, label };
}

function CatBadge({ extra }) {
  const info = moveCategory(extra);
  if (!info) return null;
  return (
    <span className={`cat-badge ${info.cat}`} title={info.label}>
      <CatIcon cat={info.cat} />
      <span>{info.label}</span>
    </span>
  );
}

function MoveKind({ extra, typesMap, compact = false }) {
  if (!extra) return null;
  const cat = moveCategory(extra)?.cat || "status";
  const power = Number(extra.power) || 0;
  const accuracy = Number(extra.accuracy) || 0;
  return (
    <div className={`move-kind ${compact ? "compact" : ""}`}>
      <span className="type-chip slim" style={{ "--tc": typeColor(extra.type) }}>
        {typeName(typesMap, extra.type)}
      </span>
      <div className="move-nums">
        <span className={`num-badge ${power ? cat : "none"}`} title={power ? `Potencia ${power}` : "Sin daño"}>
          <em>Pot.</em>
          <strong>{power || "—"}</strong>
        </span>
        <span
          className={`num-badge ${accuracy ? "acc" : "none"}`}
          title={accuracy ? `Precisión ${accuracy}` : "Nunca falla"}
        >
          <em>Prec.</em>
          <strong>{accuracy || "—"}</strong>
        </span>
      </div>
    </div>
  );
}

function TypeBadges({ rows, empty = "—" }) {
  if (!rows?.length) return <p className="muted">{empty}</p>;
  return (
    <div className="type-flow">
      {rows.map((r) => (
        <span key={r.id} className="type-chip slim" style={{ "--tc": typeColor(r.id) }}>
          {r.name} ×{r.mult}
        </span>
      ))}
    </div>
  );
}

function moveBlob(move, extra, typesMap, extras = []) {
  return [
    move?.name,
    move?.move,
    extra?.name,
    extra?.type,
    extra?.description,
    typeName(typesMap, extra?.type),
    extra?.category === "Physical" ? "físico" : extra?.category === "Special" ? "especial" : extra?.category ? "estado" : "",
    ...extras,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function MovesTab({ rnd, pbs, randomRoot, items, movesMap, typesMap }) {
  const orig = (rnd.original_moves || []).map(normalizeMove).filter(Boolean);
  const rand = (rnd.random_moves || []).map(normalizeMove).filter(Boolean);
  const tmInfo = useMemo(
    () => listTmsForSpecies(rnd, pbs, randomRoot, items),
    [rnd, pbs, randomRoot, items]
  );
  const tms = tmInfo.tms;
  const [mode, setMode] = useState(() => (rand.length ? "random" : "orig"));
  const [query, setQuery] = useState("");
  const showingRandom = mode === "random";
  const list = showingRandom ? rand : orig;
  const hasRandom = rand.length > 0;
  const q = query.trim();
  const qn = q.toLowerCase();
  const filteredList = useMemo(() => {
    if (!qn) return list;
    return list.filter((m) => moveBlob(m, movesMap[m.move], typesMap, [m.level]).includes(qn));
  }, [list, qn, movesMap, typesMap]);
  const filteredTms = useMemo(() => {
    if (!qn) return tms;
    return tms.filter((tm) =>
      moveBlob(tm, movesMap[tm.move], typesMap, [tm.name, tm.id, tm.move_name]).includes(qn)
    );
  }, [tms, qn, movesMap, typesMap]);
  const hasTmCatalog =
    Object.keys(randomRoot?.tm_move_map || {}).length > 0 ||
    (randomRoot?.tms || []).length > 0 ||
    (items || []).length > 0;

  return (
    <div className="moves">
      <div className="move-toolbar">
        <div className="move-switch">
          <button className={showingRandom ? "on" : ""} onClick={() => setMode("random")}>
            Random de la partida
          </button>
          <button className={!showingRandom ? "on" : ""} onClick={() => setMode("orig")}>
            Learnset Añil
          </button>
        </div>
        <input
          className="move-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ataque, MT o tipo…"
        />
      </div>
      {showingRandom && !hasRandom && (
        <p className="muted">
          Esta especie aún no tiene learnset random en el JSON: el juego solo lo exporta
          cuando ya lo ha generado (al encontrarla o con RandomizedDataExport.export_full!).
          El de Añil está en la otra pestaña.
        </p>
      )}
      {!showingRandom && !hasRandom && (
        <p className="muted">Estos son los movimientos por nivel de Añil, no los random de tu partida.</p>
      )}
      {qn && (
        <p className="tm-count">
          {filteredList.length} por nivel · {filteredTms.length} MTs
        </p>
      )}
      {filteredList.length === 0 ? (
        <p className="muted">{qn ? `Ningún movimiento por nivel coincide con “${q}”.` : "Sin movimientos."}</p>
      ) : (
        <ul className="move-list">
          {filteredList.map((m, i) => {
            const extra = movesMap[m.move];
            return (
              <li key={`${m.move}-${i}`}>
                <span className="lv">{m.level < 0 ? "Evo" : m.level}</span>
                <div>
                  <div className="move-name">
                    <strong>{m.name}</strong>
                    <CatBadge extra={extra} />
                  </div>
                  {extra?.description && <p>{extra.description}</p>}
                </div>
                {extra && <MoveKind extra={extra} typesMap={typesMap} />}
              </li>
            );
          })}
        </ul>
      )}
      <section className="tm-block">
        <div className="tm-head">
          <h3>MTs / MOs random</h3>
        </div>
        {tmInfo.source === "inferred" && tms.length > 0 && (
          <p className="muted">
            Compatibilidad según tutor, huevo y learnset de Añil, con el movimiento random de cada MT.
          </p>
        )}
        {tms.length === 0 ? (
          <p className="muted">
            {hasTmCatalog
              ? "Este Pokémon no aprende ninguna de las MTs random según tutor, huevo o learnset."
              : "Este JSON no trae mapa de MTs. Vuelve a exportar la partida o sube también items.txt."}
          </p>
        ) : filteredTms.length === 0 ? (
          <p className="muted">Ninguna MT coincide con “{q}”.</p>
        ) : (
          <ul className="tm-list">
            {filteredTms.map((tm) => {
              const extra = movesMap[tm.move];
              return (
                <li key={tm.id}>
                  <div className="tm-main">
                    <span className="tm-id">{tm.name || tm.id}</span>
                    <strong>{tm.move_name || extra?.name || tm.move}</strong>
                    <CatBadge extra={extra} />
                  </div>
                  {extra && <MoveKind extra={extra} typesMap={typesMap} compact />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Block({ title, extra, children }) {
  return (
    <section className="block">
      <header>
        <h3>{title}</h3>
        {extra}
      </header>
      {children}
    </section>
  );
}
