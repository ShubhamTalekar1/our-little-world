// A mock library. There is no copyrighted audio here: each "song" is a small
// generative arrangement (see services/audio/synth.js) so playback actually
// makes sound without shipping or streaming music files. A real provider
// (Spotify, Apple Music…) would plug in behind services/music.
export const SONGS = [
  { id: 's1', title: 'Our Song', artist: 'The Two of Us', duration: 214, mood: 'warm', key: 0, bpm: 72, chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], color: '#E8B4A0' },
  { id: 's2', title: 'Rain on Glass', artist: 'Quiet Hours', duration: 188, mood: 'rain', key: -3, bpm: 64, chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], color: '#8FB3D9' },
  { id: 's3', title: 'Slow Dance in the Kitchen', artist: 'Low Lamp', duration: 236, mood: 'dance', key: 2, bpm: 68, chords: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [5, 9, 12, 16]], color: '#F2C98B' },
  { id: 's4', title: 'Postcards', artist: 'Miles Apart', duration: 201, mood: 'warm', key: 5, bpm: 76, chords: [[0, 4, 7, 9], [-3, 0, 4, 7], [2, 5, 9, 12], [-5, -1, 2, 5]], color: '#B8A7D9' },
  { id: 's5', title: 'Starlight, Mostly', artist: 'Night Swimming', duration: 245, mood: 'stars', key: -5, bpm: 60, chords: [[0, 7, 11, 14], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]], color: '#9DB8A0' },
  { id: 's6', title: 'Sunday Pancakes', artist: 'Butter & Honey', duration: 176, mood: 'happy', key: 7, bpm: 88, chords: [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [5, 9, 12, 17]], color: '#EFD58F' },
  { id: 's7', title: 'Two Time Zones', artist: 'Miles Apart', duration: 222, mood: 'rain', key: -1, bpm: 66, chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 8], [-5, -1, 2, 5]], color: '#8FB3D9' },
  { id: 's8', title: 'Honey, Stay', artist: 'Low Lamp', duration: 198, mood: 'dance', key: 4, bpm: 70, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 5]], color: '#D98E96' },
];

export const DEFAULT_PLAYLISTS = [
  { id: 'our-songs', name: 'Our Songs', emoji: '💞', songIds: ['s1', 's3', 's8'] },
  { id: 'her-favs', name: 'Her Favorites', emoji: '🌷', songIds: ['s4', 's6', 's1'] },
  { id: 'my-favs', name: 'My Favorites', emoji: '🎧', songIds: ['s5', 's2'] },
  { id: 'rainy', name: 'Songs for Rainy Nights', emoji: '🌧️', songIds: ['s2', 's7', 's5'] },
];
