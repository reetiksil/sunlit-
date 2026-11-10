import { Book, Chapter, Genre } from "@/types";

export const GENRES: Genre[] = [
  { id: "g1", slug: "slice-of-life", name: "Slice of Life", description: "Quiet everyday moments and warm tea.", colorToken: "primary" },
  { id: "g2", slug: "fantasy", name: "Fantasy", description: "Soft magic, ancient libraries, and gentle worlds.", colorToken: "sky" },
  { id: "g3", slug: "romance", name: "Romance", description: "Slow-burn connection and heartfelt letters.", colorToken: "blush" },
  { id: "g4", slug: "cozy", name: "Cozy Fiction", description: "Comforting tales with peaceful resolutions.", colorToken: "mint" },
  { id: "g5", slug: "mystery", name: "Mystery", description: "Thoughtful puzzles in sleepy coastal towns.", colorToken: "sky" },
  { id: "g6", slug: "sci-fi", name: "Sci-Fi", description: "Contemplative journeys across quiet stars.", colorToken: "mint" },
  { id: "g7", slug: "adventure", name: "Adventure", description: "Wandering trails, cartography, and discovery.", colorToken: "primary" },
  { id: "g8", slug: "historical", name: "Historical", description: "Timeless eras brought to warm life.", colorToken: "blush" },
];

const SEED_TITLES: Array<{
  title: string;
  author: string;
  genres: Book["genres"];
  status: Book["status"];
  blurb: string;
  motif: Book["coverStyle"]["motif"];
  from: string;
  to: string;
}> = [
  { title: "The Lantern by the Hill", author: "Clara Vance", genres: ["slice-of-life", "cozy"], status: "ongoing", blurb: "An apprentice clockmaker restores a hillside lighthouse that only glows when someone in the valley needs comfort.", motif: "sun", from: "#FCE7B2", to: "#F7C59F" },
  { title: "Letters to the Greenhouse", author: "Julian Thorne", genres: ["romance", "slice-of-life"], status: "completed", blurb: "Two botanists correspond across continents through pressed wildflowers and handwritten notes.", motif: "leaf", from: "#D4F0E2", to: "#A8DCC3" },
  { title: "Cartography of Quiet Seas", author: "Maren Lindqvist", genres: ["adventure", "fantasy"], status: "ongoing", blurb: "Sailing across a placid archipelago where islands drift with the seasons and songs serve as compasses.", motif: "waves", from: "#D6ECF8", to: "#9BC9E8" },
  { title: "The Baker of Windmill Lane", author: "Hana Takahashi", genres: ["cozy", "slice-of-life"], status: "completed", blurb: "Every loaf of sourdough at the corner bakery carries a forgotten memory back to its rightful owner.", motif: "sun", from: "#FDEAC6", to: "#F5C28B" },
  { title: "Observatory of Drifting Stars", author: "Theo Alverez", genres: ["sci-fi", "slice-of-life"], status: "ongoing", blurb: "A lone archivist tends an orbital conservatory, listening to gentle radio transmissions from old Earth.", motif: "stars", from: "#DCE6F7", to: "#B5C9EB" },
  { title: "Anne of Green Gables", author: "L. M. Montgomery", genres: ["slice-of-life", "historical"], status: "completed", blurb: "The classic public-domain tale of imaginative Anne Shirley finding her home among the orchards of Avonlea.", motif: "leaf", from: "#E0F2DF", to: "#B6DFB9" },
  { title: "The Wind in the Willows", author: "Kenneth Grahame", genres: ["cozy", "adventure"], status: "completed", blurb: "Peaceful riverbank afternoons with Mole, Ratty, Badger, and Mr. Toad along the Thames.", motif: "waves", from: "#D8EFE9", to: "#9ED4C6" },
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", genres: ["historical", "cozy"], status: "completed", blurb: "Behind a locked ivy wall, a neglected Yorkshire garden awakens to sunlight and friendship.", motif: "arch", from: "#F9E2DC", to: "#F2B8A7" },
  { title: "Tea at the Paper Moon", author: "Sora Watanabe", genres: ["fantasy", "cozy"], status: "ongoing", blurb: "A nocturnal teahouse opens its doors only on clear nights, brewing infusions steeped in starlight.", motif: "moon", from: "#E5E2F9", to: "#C2BBE8" },
  { title: "Whispers in the Bookbindery", author: "Eleanor Finch", genres: ["mystery", "historical"], status: "ongoing", blurb: "When an unsigned manuscript arrives in 1920s Oxford, a quiet bookbinder follows the marginalia.", motif: "arch", from: "#F5E6D3", to: "#E2C5A3" },
  { title: "Summer Train to Kamakura", author: "Renji Sato", genres: ["slice-of-life", "romance"], status: "completed", blurb: "Seven seaside train stops, seven rainy afternoons, and two commuters sharing an umbrella.", motif: "waves", from: "#D9F0FA", to: "#A3D4EC" },
  { title: "The Apothecary's Almanac", author: "Freya Lind", genres: ["fantasy", "slice-of-life"], status: "ongoing", blurb: "Cataloging alpine herbs, friendly woodland spirits, and winter remedies in a snow-covered cottage.", motif: "leaf", from: "#DCF2E6", to: "#A7DABF" },
  { title: "Little Women", author: "Louisa May Alcott", genres: ["historical", "slice-of-life"], status: "completed", blurb: "The warm, enduring story of the four March sisters growing up in New England.", motif: "sun", from: "#FCE5D8", to: "#F4BEA6" },
  { title: "Chronicles of the Cloud Shepherd", author: "Liam O'Connor", genres: ["fantasy", "adventure"], status: "ongoing", blurb: "Guiding flocks of cumulus clouds over parched valleys from the deck of a timber airship.", motif: "sun", from: "#E2F1FB", to: "#B0D6F0" },
  { title: "Mystery at Meadowbrook Inn", author: "Beatrice Abbott", genres: ["mystery", "cozy"], status: "completed", blurb: "A missing heirloom pocket watch turns a snowy weekend retreat into a polite parlour investigation.", motif: "arch", from: "#F9ECD9", to: "#ECCB9E" },
  { title: "The Clockwork Nightingale", author: "Arthur Pendelton", genres: ["fantasy", "historical"], status: "ongoing", blurb: "A brass songbird built for a lonely empress learns to sing melodies of the open forest.", motif: "moon", from: "#FCEECF", to: "#EBC888" },
  { title: "Orchard of Silver Apples", author: "Maeve Gallagher", genres: ["fantasy", "romance"], status: "completed", blurb: "At the edge of an autumn wood, two childhood friends reunite for the harvest festival.", motif: "leaf", from: "#F7DFD6", to: "#E9B1A0" },
  { title: "Signals from Lagrange Point Four", author: "Dr. Elena Rostova", genres: ["sci-fi", "mystery"], status: "ongoing", blurb: "A deep-space listening post receives a gentle acoustic piano melody repeating every forty-two hours.", motif: "stars", from: "#DEE5F5", to: "#ADC0E8" },
  { title: "TheWatercolorist of Verona", author: "Matteo Conti", genres: ["historical", "romance"], status: "completed", blurb: "Capturing terracotta rooftops and morning piazzas before the midday heat arrives.", motif: "sun", from: "#FDE7CF", to: "#F6BE90" },
  { title: "Bicycles & Blueberries", author: "Astrid Holm", genres: ["slice-of-life", "cozy"], status: "ongoing", blurb: "A summer spent delivering library books by bicycle across a Swedish island.", motif: "waves", from: "#DDF2E8", to: "#A9DEC5" },
  { title: "A Room with a View", author: "E. M. Forster", genres: ["historical", "romance"], status: "completed", blurb: "Sunlight over the Arno in Florence transforms the quiet life of Lucy Honeychurch.", motif: "arch", from: "#FBE5D6", to: "#F0BD9D" },
  { title: "The Glassblower's Apprentice", author: "Lucas Moretti", genres: ["slice-of-life", "historical"], status: "ongoing", blurb: "Spinning molten sand into prism lanterns on the quiet canals of Murano.", motif: "sun", from: "#E3F2FD", to: "#AED5F2" },
  { title: "Starlight Over Cedar Creek", author: "Nora Jenkins", genres: ["romance", "cozy"], status: "completed", blurb: "A small-town planetarium director hosts midnight stargazing sessions for insomniacs.", motif: "stars", from: "#E6E4F7", to: "#C0BCE6" },
  { title: "The Gentle Botanist's Field Guide", author: "moss & quill", genres: ["adventure", "slice-of-life"], status: "ongoing", blurb: "Sketching luminescent mosses and high-altitude ferns across the misty northern highlands.", motif: "leaf", from: "#DFF4E4", to: "#AFDFBD" },
];

export const SEED_BOOKS: Book[] = SEED_TITLES.map((item, idx) => {
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    id: `book-${idx + 1}`,
    slug,
    title: item.title,
    author: item.author,
    blurb: item.blurb,
    description: `${item.blurb} Written for unhurried afternoons, "${item.title}" invites readers into a richly textured atmosphere where small gestures carry deep resonance. Whether you are reading with a morning cup of tea or winding down under lamplight, each chapter unfolds at a gentle, contemplative pace.`,
    status: item.status,
    genres: item.genres,
    rating: Number((4.5 + ((idx * 7) % 5) * 0.1).toFixed(1)),
    views: 12400 + idx * 3150,
    featured: idx < 4,
    weeklyRank: idx < 8 ? idx + 1 : undefined,
    updatedAt: new Date(Date.now() - idx * 3600 * 1000 * 5).toISOString(),
    createdAt: new Date(Date.now() - (30 - idx) * 86400 * 1000).toISOString(),
    chapterCount: 12,
    coverStyle: {
      gradientFrom: item.from,
      gradientTo: item.to,
      accentColor: "#2F3B4A",
      motif: item.motif,
    },
  };
});

// Public-Domain Excerpts (Project Gutenberg inspired)
const PUBLIC_DOMAIN_PARAGRAPHS = [
  "The morning sunlight slanted across the worn oak floorboards, warming the dust motes that drifted lazily between the bookshelves. Outside the casement window, the orchard boughs stirred in a breeze scented with clover and early apples.",
  "There is nothing—absolutely nothing—half so much worth doing as simply messing about in boats, or perhaps sitting quietly under the shade of a willow with an uncut volume resting in one's lap while the river murmurs past.",
  "She paused by the garden gate and listened. A robin was singing from the topmost spray of the ivy wall, clear and unhurried, as though the entire afternoon belonged solely to its song.",
  "In the quiet of the reading room, the tall grandfather clock ticked with a steady, reassuring cadence. Page after page turned softly, carrying the mind far beyond the stone walls into meadows of golden light.",
  "When evening finally settled over the valley, a single warm lantern was lit in the window. Its amber reflection danced upon the pond, promising that tomorrow would bring another peaceful chapter.",
];

export const SEED_CHAPTERS: Record<string, Chapter[]> = {};

SEED_BOOKS.forEach((book) => {
  SEED_CHAPTERS[book.id] = Array.from({ length: book.chapterCount }, (_, i) => {
    const num = i + 1;
    return {
      id: `${book.id}-ch-${num}`,
      bookId: book.id,
      number: num,
      title:
        num === 1
          ? "Sunlight on the Threshold"
          : num === 2
          ? "Letters Left on the Oak Table"
          : num === 3
          ? "The Sound of Rain on Glass"
          : `Quiet Footsteps, Part ${num}`,
      content: [
        `Chapter ${num} opens in the hush of early morning inside the world of ${book.title}.`,
        ...PUBLIC_DOMAIN_PARAGRAPHS,
        `As the light shifted toward golden hour, the promise of ${book.author}'s narrative continued to unfold gently.`,
      ],
      wordCount: 1450 + num * 65,
      publishedAt: new Date(Date.now() - (book.chapterCount - num) * 86400000).toISOString(),
      status: "published",
    };
  });
});
