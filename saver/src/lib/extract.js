// Turns a fetched page (a DOM Document) into what the app stores:
// preview metadata, plus a recipe, place or book when the page describes one.
// Pure — no network — so it runs the same in the browser and in tests.

const clean = (s) =>
  typeof s === 'string'
    ? s
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

function meta(doc, ...names) {
  for (const n of names) {
    const el = doc.querySelector(`meta[property="${n}"], meta[name="${n}"], meta[itemprop="${n}"]`);
    const v = el?.getAttribute('content');
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function absolute(href, base) {
  if (!href) return '';
  try {
    return new URL(href, base).href;
  } catch {
    return '';
  }
}

/** All JSON-LD nodes on the page, with @graph and nested arrays flattened. */
export function jsonLdNodes(doc) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    out.push(node);
    if (node['@graph']) visit(node['@graph']);
    if (node.mainEntity) visit(node.mainEntity);
  };
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      // Some sites leave raw control characters inside strings.
      visit(JSON.parse(s.textContent.replace(/[\u0000-\u001f]+/g, ' ')));
    } catch {
      /* broken JSON-LD is common; skip it */
    }
  }
  return out;
}

const typesOf = (node) => asArray(node?.['@type']).map((t) => String(t).toLowerCase());
const findNode = (nodes, wanted) => nodes.find((n) => typesOf(n).some((t) => wanted.includes(t)));

function imageOf(v, base) {
  for (const img of asArray(v)) {
    if (typeof img === 'string') return absolute(img, base);
    if (img?.url) return absolute(img.url, base);
    if (img?.contentUrl) return absolute(img.contentUrl, base);
  }
  return '';
}

/** "PT1H30M" → 90. Returns null when absent or unparseable. */
export function isoMinutes(v) {
  const m = String(v || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return null;
  const mins = (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) + Math.round((+m[4] || 0) / 60);
  return mins || null;
}

function instructionsOf(v) {
  const steps = [];
  const visit = (x) => {
    if (!x) return;
    if (typeof x === 'string') {
      // A single blob of text: split on line breaks, or on "1. … 2. …" when it's numbered.
      const numbered = /^\s*1[.)]\s/.test(x);
      x.split(numbered ? /[\r\n]+|\s(?=\d{1,2}[.)]\s)/ : /[\r\n]+/)
        .map((s) => (numbered ? s.replace(/^\s*\d{1,2}[.)]\s+/, '') : s))
        .map(clean)
        .filter(Boolean)
        .forEach((s) => steps.push(s));
      return;
    }
    if (Array.isArray(x)) return x.forEach(visit);
    if (x.itemListElement) return visit(x.itemListElement);
    const t = clean(x.text || x.name || '');
    if (t) steps.push(t);
  };
  visit(v);
  return steps;
}

function recipeFromJsonLd(node, base) {
  const ingredients = asArray(node.recipeIngredient || node.ingredients).map(clean).filter(Boolean);
  const steps = instructionsOf(node.recipeInstructions);
  if (!ingredients.length && !steps.length) return null;
  const yieldV = asArray(node.recipeYield).map((y) => clean(String(y)));
  return {
    ingredients,
    steps,
    servings: yieldV.find((y) => /\D/.test(y)) || yieldV[0] || '',
    totalMinutes: isoMinutes(node.totalTime) || (isoMinutes(node.prepTime) || 0) + (isoMinutes(node.cookTime) || 0) || null,
    image: imageOf(node.image, base),
  };
}

/** Recipe plugins that don't emit JSON-LD still mark up their lists. */
function recipeFromMarkup(doc) {
  const text = (sel) => [...doc.querySelectorAll(sel)].map((e) => clean(e.textContent)).filter(Boolean);
  const ingredients = text(
    '[itemprop="recipeIngredient"], [itemprop="ingredients"], .wprm-recipe-ingredient, .tasty-recipes-ingredients li, .mv-create-ingredients li'
  );
  const steps = text(
    '[itemprop="recipeInstructions"] li, .wprm-recipe-instruction-text, .tasty-recipes-instructions li, .mv-create-instructions li'
  );
  if (!steps.length) {
    const single = text('[itemprop="recipeInstructions"]');
    if (single.length) steps.push(...instructionsOf(single.join('\n')));
  }
  if (ingredients.length < 2) return null;
  return { ingredients, steps, servings: '', totalMinutes: null, image: '' };
}

const PLACE_TYPES = [
  'place', 'localbusiness', 'restaurant', 'foodestablishment', 'cafeorcoffeeshop', 'barorpub', 'bakery',
  'touristattraction', 'landmarksorhistoricalbuildings', 'museum', 'park', 'hotel', 'lodgingbusiness',
  'store', 'civicstructure', 'beach', 'campground', 'nightclub', 'winery', 'brewery',
];

function addressOf(a) {
  if (!a) return '';
  if (typeof a === 'string') return clean(a);
  return [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry?.name || a.addressCountry]
    .filter((x) => typeof x === 'string' && x.trim())
    .map(clean)
    .join(', ');
}

function placeFromPage(doc, nodes) {
  const node = findNode(nodes, PLACE_TYPES);
  const geo = node?.geo || {};
  let lat = parseFloat(geo.latitude);
  let lng = parseFloat(geo.longitude);
  if (!Number.isFinite(lat)) {
    lat = parseFloat(meta(doc, 'place:location:latitude', 'og:latitude', 'latitude'));
    lng = parseFloat(meta(doc, 'place:location:longitude', 'og:longitude', 'longitude'));
  }
  if (!Number.isFinite(lat)) {
    const pos = meta(doc, 'geo.position', 'ICBM').split(/[;,]/);
    lat = parseFloat(pos[0]);
    lng = parseFloat(pos[1]);
  }
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const address = addressOf(node?.address);
  if (!node && !hasCoords) return null;
  return {
    name: clean(node?.name || ''),
    address,
    ...(hasCoords ? { lat, lng } : {}),
  };
}

function bookFromPage(doc, nodes) {
  const node = findNode(nodes, ['book']);
  const ogType = meta(doc, 'og:type').toLowerCase();
  if (!node && !ogType.startsWith('book')) return null;
  const author = asArray(node?.author)
    .map((a) => clean(typeof a === 'string' ? a : a?.name))
    .filter(Boolean)
    .join(', ');
  return { author: author || meta(doc, 'book:author', 'books:author') };
}

/**
 * Everything the app wants from one page.
 * `kinds` lists the schema.org / og types seen, lower-cased, for classification.
 */
export function extractPage(doc, url) {
  const nodes = jsonLdNodes(doc);
  const recipeNode = findNode(nodes, ['recipe']);
  const main = recipeNode || findNode(nodes, ['article', 'newsarticle', 'blogposting', 'product', 'book', ...PLACE_TYPES]);

  const title = clean(
    meta(doc, 'og:title', 'twitter:title') || main?.name || main?.headline || doc.querySelector('title')?.textContent || ''
  );
  const description = clean(meta(doc, 'og:description', 'twitter:description', 'description') || main?.description || '');
  const image =
    absolute(meta(doc, 'og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src', 'image'), url) ||
    imageOf(main?.image, url);
  const siteName = clean(meta(doc, 'og:site_name', 'application-name', 'twitter:site').replace(/^@/, ''));

  const recipe = (recipeNode && recipeFromJsonLd(recipeNode, url)) || recipeFromMarkup(doc);
  const kinds = [...new Set([...nodes.flatMap(typesOf), meta(doc, 'og:type').toLowerCase()].filter(Boolean))];

  return {
    title,
    description,
    image: image || recipe?.image || '',
    siteName,
    recipe,
    place: placeFromPage(doc, nodes),
    book: bookFromPage(doc, nodes),
    kinds,
  };
}
