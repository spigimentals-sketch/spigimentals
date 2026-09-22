import { db } from './db.js';
import { RESOURCES } from './resources.js';

// Ported from the old src/data/*.js static files — inserted once, the first
// time each table is empty, so admins can freely edit/delete after that
// without this running again.
const SEED = {
  tracks: [
    { title: 'Midnight in Akwa', artist: 'Spigimentals', bpm: 96, key: 'D min', mood: 'Late-night / Introspective', tags: ['r&b', 'afrobeats'], plays: '34.2K', spotifyUrl: null },
    { title: 'Wouri River', artist: 'Spigimentals ft. Ama', bpm: 104, key: 'A maj', mood: 'Uplifting / Afro-fusion', tags: ['afrobeats'], plays: '51.8K', spotifyUrl: null },
    { title: 'Concrete Bloom', artist: 'Spigimentals', bpm: 140, key: 'F min', mood: 'Dark / Trap', tags: ['trap', 'drill'], plays: '19.4K', spotifyUrl: null },
    { title: 'Slow Burn', artist: 'Spigimentals ft. Kwesi', bpm: 90, key: 'C maj', mood: 'Lofi / Romantic', tags: ['lofi', 'r&b'], plays: '27.1K', spotifyUrl: null },
  ],
  beats: [
    { title: 'Cathedral Bounce', bpm: 142, key: 'F# min', mood: 'Dark / Cinematic', priceBasic: 35, pricePremium: 120, priceExclusive: 800, tags: ['trap', 'drill'], plays: '12.4K' },
    { title: 'Honeycomb', bpm: 96, key: 'D maj', mood: 'Warm / Soulful', priceBasic: 30, pricePremium: 99, priceExclusive: 600, tags: ['r&b'], plays: '8.2K' },
    { title: 'Lagos Nights', bpm: 108, key: 'A min', mood: 'Energetic / Afro', priceBasic: 40, pricePremium: 140, priceExclusive: 950, tags: ['afrobeats'], plays: '21.6K' },
    { title: 'Spectre', bpm: 130, key: 'G# min', mood: 'Eerie / Hard', priceBasic: 35, pricePremium: 120, priceExclusive: 750, tags: ['trap'], plays: '9.7K' },
    { title: 'Cassette Love', bpm: 88, key: 'C maj', mood: 'Lofi / Romantic', priceBasic: 25, pricePremium: 85, priceExclusive: 500, tags: ['lofi'], plays: '15.1K' },
    { title: 'Voodoo Drum', bpm: 124, key: 'E min', mood: 'Tribal / Heavy', priceBasic: 40, pricePremium: 140, priceExclusive: 900, tags: ['afrobeats'], plays: '18.3K' },
  ],
  packs: [
    { title: 'Douala Drum Kit Vol. 1', description: '120 one-shots and loops sampled from live percussion sessions — kicks, claps, shakers, talking drum.', price: 25, sampleCount: 120, tags: ['drums', 'afrobeats'] },
    { title: 'Trap Essentials', description: '808s, hi-hat rolls, and cinematic risers built for dark trap and drill production.', price: 30, sampleCount: 95, tags: ['trap', 'drill'] },
    { title: 'Lofi Textures', description: 'Vinyl crackle, tape hiss, warm keys, and jazzy chord loops for lofi and R&B beds.', price: 20, sampleCount: 80, tags: ['lofi', 'r&b'] },
    { title: 'Highlife Guitars', description: 'Clean and palm-muted highlife guitar loops recorded direct, in multiple keys and tempos.', price: 28, sampleCount: 60, tags: ['afrobeats', 'highlife'] },
  ],
  plugins: [
    { name: 'Plugin Name — Replace Me', tagline: 'One-line hook for what it does', description: 'TODO: Replace with your real plugin description — what problem it solves, what makes it different.', price: 49, category: 'Compressor', formats: ['VST3', 'AU', 'AAX'], os: ['Windows', 'macOS'], version: '1.0.0' },
    { name: 'Second Plugin — Replace Me', tagline: 'One-line hook for what it does', description: 'TODO: Replace with your real plugin description.', price: 39, category: 'EQ', formats: ['VST3', 'AU'], os: ['Windows', 'macOS'], version: '1.0.0' },
  ],
  courses: [
    { title: 'Mixing Fundamentals', instructor: 'Spigi', description: 'EQ, compression, and gain staging from a blank session to a mix that translates on any speaker.', price: 79, lessons: 12, level: 'Beginner' },
    { title: 'Afrobeats Drum Programming', instructor: 'Spigi', description: 'Build authentic Afrobeats grooves from scratch — log drum, shakers, percussion layering, swing.', price: 59, lessons: 8, level: 'Intermediate' },
    { title: 'Vocal Recording & Tuning', instructor: 'DJ Manyu', description: 'Mic technique, comping takes, and tuning vocals so they sit naturally in a busy mix.', price: 69, lessons: 10, level: 'Beginner' },
    { title: 'Mastering on a Budget', instructor: 'Spigi', description: 'Get commercial-loudness masters out of a modest plugin chain — no expensive outboard gear.', price: 89, lessons: 6, level: 'Advanced' },
  ],
};

export function seedIfEmpty() {
  for (const [name, resource] of Object.entries(RESOURCES)) {
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${resource.table}`).get();
    if (count > 0) continue;

    for (const row of SEED[name] || []) {
      const present = resource.fields.filter((f) => row[f.key] !== undefined);
      const colList = present.map((f) => `"${f.col}"`).join(', ');
      const placeholders = present.map(() => '?').join(', ');
      const values = present.map((f) => (f.array ? JSON.stringify(row[f.key] || []) : row[f.key]));
      db.prepare(`INSERT INTO ${resource.table} (${colList}) VALUES (${placeholders})`).run(...values);
    }
  }
}
