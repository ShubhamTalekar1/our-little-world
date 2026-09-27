import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { findUrl, placeFromMapUrl, videoEmbedUrl, youtubeId } from '../src/lib/links.js';
import { extractPage, isoMinutes } from '../src/lib/extract.js';
import { classify, autoTags } from '../src/lib/classify.js';

const doc = (html) => new DOMParser().parseFromString(html, 'text/html');

test('findUrl pulls the link out of shared text', () => {
  assert.equal(findUrl('Look at this! https://example.com/a?b=1.'), 'https://example.com/a?b=1');
  assert.equal(findUrl('(https://youtu.be/abc123XYZ)'), 'https://youtu.be/abc123XYZ');
  assert.equal(findUrl('just a thought'), null);
});

test('youtube ids and embeds', () => {
  assert.equal(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3'), 'dQw4w9WgXcQ');
  assert.equal(youtubeId('https://youtube.com/shorts/abcDEF12345'), 'abcDEF12345');
  assert.equal(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=x'), 'dQw4w9WgXcQ');
  assert.equal(videoEmbedUrl('https://vimeo.com/76979871'), 'https://player.vimeo.com/video/76979871');
  assert.equal(videoEmbedUrl('https://www.tiktok.com/@a/video/7234567890123'), 'https://www.tiktok.com/embed/v2/7234567890123');
});

test('places from map links', () => {
  const g = placeFromMapUrl(
    'https://www.google.com/maps/place/Caf%C3%A9+Mondegar/@18.9269,72.8298,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d18.9270!4d72.8323'
  );
  assert.equal(g.name, 'Café Mondegar');
  assert.deepEqual([g.lat, g.lng], [18.927, 72.8323]); // the pin, not the viewport
  assert.deepEqual(placeFromMapUrl('https://maps.google.com/?q=48.8584,2.2945'), { lat: 48.8584, lng: 2.2945 });
  assert.deepEqual(placeFromMapUrl('https://maps.apple.com/?q=Blue+Tokai&ll=19.1,72.83'), { lat: 19.1, lng: 72.83, name: 'Blue Tokai' });
  assert.deepEqual(placeFromMapUrl('https://www.google.com/maps/search/?api=1&query=Eiffel+Tower'), { name: 'Eiffel Tower' });
  assert.deepEqual(placeFromMapUrl('https://maps.app.goo.gl/Ab12Cd'), {});
  assert.equal(placeFromMapUrl('https://example.com/?q=1,2'), null);
});

test('ISO durations', () => {
  assert.equal(isoMinutes('PT1H30M'), 90);
  assert.equal(isoMinutes('PT45M'), 45);
  assert.equal(isoMinutes('P0DT2H'), 120);
  assert.equal(isoMinutes(''), null);
});

test('recipe from JSON-LD @graph with HowToSections', () => {
  const page = extractPage(
    doc(`<html><head><title>Fallback</title>
      <meta property="og:title" content="Best Dal Tadka">
      <meta property="og:image" content="/img/dal.jpg">
      <meta property="og:site_name" content="Spice Kitchen">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[
        {"@type":"WebPage","name":"x"},
        {"@type":"Recipe","name":"Dal Tadka","recipeYield":["4","4 servings"],"totalTime":"PT40M",
         "recipeIngredient":["1 cup toor dal","2 tbsp ghee","1 tsp cumin &amp; mustard seeds"],
         "recipeInstructions":[{"@type":"HowToSection","name":"Dal","itemListElement":[
           {"@type":"HowToStep","text":"Rinse and pressure cook the dal."}]},
           {"@type":"HowToStep","text":"Temper <b>cumin</b> in ghee."}]}
      ]}</script></head><body></body></html>`),
    'https://spice.example/dal'
  );
  assert.equal(page.title, 'Best Dal Tadka');
  assert.equal(page.image, 'https://spice.example/img/dal.jpg');
  assert.equal(page.siteName, 'Spice Kitchen');
  assert.deepEqual(page.recipe.ingredients, ['1 cup toor dal', '2 tbsp ghee', '1 tsp cumin & mustard seeds']);
  assert.deepEqual(page.recipe.steps, ['Rinse and pressure cook the dal.', 'Temper cumin in ghee.']);
  assert.equal(page.recipe.totalMinutes, 40);
  assert.equal(page.recipe.servings, '4 servings');
  assert.equal(classify('https://spice.example/dal', page), 'recipe');
  assert.ok(!autoTags(page).includes('quick'));
});

test('recipe instructions as one numbered string', () => {
  const page = extractPage(
    doc(`<script type="application/ld+json">{"@type":"Recipe","recipeIngredient":["a","b"],
      "recipeInstructions":"1. Heat oven to 180. 2. Mix everything. 3. Bake 20 minutes."}</script>`),
    'https://x.example/'
  );
  assert.deepEqual(page.recipe.steps, ['Heat oven to 180.', 'Mix everything.', 'Bake 20 minutes.']);
});

test('recipe from WordPress plugin markup without JSON-LD', () => {
  const page = extractPage(
    doc(`<title>Cookies</title><ul><li class="wprm-recipe-ingredient">200g flour</li><li class="wprm-recipe-ingredient">100g butter</li></ul>
      <div class="wprm-recipe-instruction-text">Cream butter.</div><div class="wprm-recipe-instruction-text">Add flour.</div>`),
    'https://blog.example/cookies'
  );
  assert.deepEqual(page.recipe.ingredients, ['200g flour', '100g butter']);
  assert.deepEqual(page.recipe.steps, ['Cream butter.', 'Add flour.']);
});

test('restaurant page gives a place with coordinates and address', () => {
  const page = extractPage(
    doc(`<meta property="og:title" content="Toit Brewpub">
      <script type="application/ld+json">[{"@type":"Restaurant","name":"Toit","address":{"@type":"PostalAddress",
        "streetAddress":"298 100 Feet Rd","addressLocality":"Bengaluru","addressCountry":"IN"},
        "geo":{"@type":"GeoCoordinates","latitude":"12.9791","longitude":"77.6406"}}]</script>`),
    'https://toit.example/'
  );
  assert.deepEqual(page.place, { name: 'Toit', address: '298 100 Feet Rd, Bengaluru, IN', lat: 12.9791, lng: 77.6406 });
  assert.equal(classify('https://toit.example/', page), 'place');
});

test('broken JSON-LD is skipped, meta tags still work', () => {
  const page = extractPage(
    doc(`<script type="application/ld+json">{ not json</script><meta name="description" content="Hello">`),
    'https://x.example/'
  );
  assert.equal(page.description, 'Hello');
  assert.equal(page.recipe, null);
});

test('classification by host and words', () => {
  const c = (url, title = '', extra = {}) => classify(url, { title, ...extra });
  assert.equal(c('https://www.youtube.com/watch?v=abcdefghijk', 'Lofi beats to study to'), 'video');
  assert.equal(c('https://www.youtube.com/watch?v=abcdefghijk', 'Easy Paneer Butter Masala Recipe'), 'recipe');
  assert.equal(c('https://www.tiktok.com/@x/video/1', '10 min HIIT workout'), 'workout');
  assert.equal(c('https://www.instagram.com/reel/Cx1/', 'Hidden gems in Lisbon'), 'place');
  assert.equal(c('https://www.goodreads.com/book/show/1'), 'book');
  assert.equal(c('https://open.spotify.com/album/1'), 'music');
  assert.equal(c('https://www.amazon.in/dp/B0'), 'product');
  assert.equal(c('https://www.amazon.in/dp/B0', 'Atomic Habits Paperback'), 'book');
  assert.equal(c('https://maps.app.goo.gl/x'), 'place');
  assert.equal(c('https://someone.substack.com/p/x'), 'article');
  assert.equal(c('https://blog.example/post', 'Thoughts', { kinds: ['article'] }), 'article');
  assert.equal(c('https://example.com/'), 'other');
  assert.equal(classify(null, { title: 'Try the chocolate chip cookies recipe from mum' }), 'recipe');
  assert.equal(classify(null, { title: 'Call the plumber' }), 'note');
});
