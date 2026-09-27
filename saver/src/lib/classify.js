// Sorting saves into smart collections. Signals, strongest first:
// structured data on the page → the host → words in the title/description.

import { hostMatches, isMapUrl, isVideoUrl } from './links.js';

export const KINDS = [
  { id: 'recipe', label: 'Recipes', emoji: '🍳', color: '#e07a5f' },
  { id: 'place', label: 'Places', emoji: '📍', color: '#3d8b7d' },
  { id: 'video', label: 'Videos', emoji: '🎬', color: '#c44569' },
  { id: 'book', label: 'Books', emoji: '📚', color: '#8e6c8a' },
  { id: 'article', label: 'Reads', emoji: '📰', color: '#5b7db1' },
  { id: 'workout', label: 'Workouts', emoji: '💪', color: '#e0a13a' },
  { id: 'music', label: 'Music', emoji: '🎧', color: '#6c5ce7' },
  { id: 'product', label: 'Shopping', emoji: '🛍️', color: '#b5838d' },
  { id: 'note', label: 'Notes', emoji: '📝', color: '#7f8c8d' },
  { id: 'other', label: 'Other', emoji: '🔗', color: '#95a5a6' },
];

export const kindInfo = (id) => KINDS.find((k) => k.id === id) || KINDS[KINDS.length - 1];

const BOOK_HOSTS = ['goodreads.com', 'openlibrary.org', 'books.google.com', 'storygraph.com', 'thestorygraph.com', 'bookshop.org', 'audible.com'];
const MUSIC_HOSTS = ['open.spotify.com', 'spotify.com', 'music.apple.com', 'soundcloud.com', 'bandcamp.com', 'music.youtube.com', 'deezer.com', 'tidal.com'];
const SHOP_HOSTS = ['amazon.com', 'amazon.co.uk', 'amazon.in', 'amazon.de', 'etsy.com', 'ebay.com', 'flipkart.com', 'ikea.com', 'aliexpress.com', 'myntra.com', 'zara.com'];
const PLACE_HOSTS = ['tripadvisor.com', 'yelp.com', 'airbnb.com', 'booking.com', 'zomato.com', 'opentable.com', 'foursquare.com', 'timeout.com', 'atlasobscura.com'];
const READ_HOSTS = ['medium.com', 'substack.com', 'nytimes.com', 'theguardian.com', 'bbc.co.uk', 'bbc.com', 'wikipedia.org', 'dev.to', 'news.ycombinator.com'];
const RECIPE_HOSTS = ['allrecipes.com', 'bbcgoodfood.com', 'seriouseats.com', 'bonappetit.com', 'food52.com', 'epicurious.com', 'cooking.nytimes.com', 'tasty.co', 'budgetbytes.com', 'hebbarskitchen.com', 'indianhealthyrecipes.com'];

const RECIPE_WORDS = /\b(recipe|recipes|ingredients?|how to (cook|make|bake)|bake[ds]?|baking|cookies?|curry|pasta|dessert|dinner idea|meal prep|one[- ]pot|air ?fryer|sourdough|biryani|paneer|dal)\b/i;
const WORKOUT_WORDS = /\b(workout|work out|exercises?|hiit|yoga|pilates|abs|glutes|reps|sets of|training plan|stretch(es|ing)?|cardio|mobility|push[- ]?ups?|squats?|deadlifts?|calisthenics|5k|couch to)\b/i;
const PLACE_WORDS = /\b(restaurant|caf[eé]|coffee shop|bar|brewery|hotel|hostel|beach|hike|trail|museum|gallery|viewpoint|things to do in|places to visit|hidden gems?|itinerary)\b/i;
const BOOK_WORDS = /\b(novel|paperback|hardcover|kindle edition|audiobook|reading list|book review)\b/i;

/**
 * @param {string|null} url
 * @param {{title?: string, description?: string, kinds?: string[], recipe?: any, place?: any, book?: any}} info
 */
export function classify(url, info = {}) {
  const kinds = info.kinds || [];
  const text = `${info.title || ''} ${info.description || ''}`;
  const has = (...ts) => ts.some((t) => kinds.includes(t));

  if (!url) {
    if (RECIPE_WORDS.test(text)) return 'recipe';
    if (WORKOUT_WORDS.test(text)) return 'workout';
    return 'note';
  }

  if (info.recipe?.ingredients?.length || has('recipe')) return 'recipe';
  if (isMapUrl(url) || hostMatches(url, PLACE_HOSTS)) return 'place';
  if (hostMatches(url, MUSIC_HOSTS)) return 'music';

  if (isVideoUrl(url)) {
    // Albo files cooking and workout videos with their kind rather than as generic videos.
    if (RECIPE_WORDS.test(text)) return 'recipe';
    if (WORKOUT_WORDS.test(text)) return 'workout';
    if (PLACE_WORDS.test(text)) return 'place';
    return 'video';
  }

  if (info.book || hostMatches(url, BOOK_HOSTS) || has('book', 'books.book')) return 'book';
  if (info.place && (info.place.lat != null || info.place.address)) return 'place';
  if (hostMatches(url, RECIPE_HOSTS)) return 'recipe';
  if (has('product', 'og:product', 'product.item') || hostMatches(url, SHOP_HOSTS)) {
    return BOOK_WORDS.test(text) ? 'book' : 'product';
  }
  if (has('video', 'video.other', 'video.movie', 'video.episode', 'videoobject')) return 'video';
  if (hostMatches(url, ['instagram.com', 'pinterest.com', 'reddit.com', 'x.com', 'twitter.com', 'threads.net'])) {
    if (RECIPE_WORDS.test(text)) return 'recipe';
    if (WORKOUT_WORDS.test(text)) return 'workout';
    if (PLACE_WORDS.test(text)) return 'place';
  }
  if (WORKOUT_WORDS.test(text)) return 'workout';
  if (has('article', 'newsarticle', 'blogposting', 'reportagenewsarticle') || hostMatches(url, READ_HOSTS)) return 'article';
  if (RECIPE_WORDS.test(info.title || '')) return 'recipe';
  if (PLACE_WORDS.test(info.title || '')) return 'place';
  return 'other';
}

/** A few automatic tags so search and filtering work before you tag anything. */
export function autoTags(info = {}) {
  const tags = new Set();
  const text = `${info.title || ''} ${info.description || ''}`.toLowerCase();
  const rules = [
    [/\b(vegan|plant[- ]based)\b/, 'vegan'],
    [/\bvegetarian\b/, 'vegetarian'],
    [/\b(quick|easy|15[- ]minute|20[- ]minute|30[- ]minute)\b/, 'quick'],
    [/\b(dessert|cake|cookies?|brownies?)\b/, 'dessert'],
    [/\b(breakfast|brunch)\b/, 'breakfast'],
    [/\b(date night|romantic)\b/, 'date night'],
    [/\b(weekend|day trip)\b/, 'weekend'],
    [/\b(free|budget|cheap)\b/, 'budget'],
    [/\b(gift|gifts)\b/, 'gift idea'],
  ];
  for (const [re, tag] of rules) if (re.test(text)) tags.add(tag);
  if (info.recipe?.totalMinutes && info.recipe.totalMinutes <= 30) tags.add('quick');
  return [...tags];
}
