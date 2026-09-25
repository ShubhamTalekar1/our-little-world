// Films that are always showing: openly licensed Blender Foundation shorts
// (CC BY), streamed from their public archives. Keys match the server's list.
export const HOUSE_FILMS = [
  {
    key: 'film:bbb',
    kind: 'house',
    title: 'Big Buck Bunny',
    tagline: 'A gentle giant. Three troublemakers. One very bad idea.',
    genre: 'Comedy',
    year: 2008,
    runtime: '10 min',
    palette: 2,
    src: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
    license: 'CC BY 3.0 · Blender Foundation',
  },
  {
    key: 'film:sintel',
    kind: 'house',
    title: 'Sintel',
    tagline: 'A girl, a dragon, and a very long search.',
    genre: 'Fantasy',
    year: 2010,
    runtime: '15 min',
    palette: 5,
    src: 'https://download.blender.org/durian/movies/sintel-1024-surround.mp4',
    license: 'CC BY 3.0 · Blender Foundation',
  },
];

export const HOUSE_BY_KEY = Object.fromEntries(HOUSE_FILMS.map((f) => [f.key, f]));

export const GENRES = ['Comedy', 'Drama', 'Romance', 'Horror', 'Thriller', 'Sci-fi', 'Fantasy', 'Animation', 'Action', 'Mystery', 'Documentary', 'Musical'];
