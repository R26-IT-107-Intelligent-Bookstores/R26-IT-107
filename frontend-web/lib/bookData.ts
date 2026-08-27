export type FeaturedBook = {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: string;
  match: string;
  description: string;
};

export const featuredBooks: FeaturedBook[] = [
  {
    id: "senkottan",
    title: "සෙන්කොට්ටං",
    author: "මහින්ද ප්‍රසාද් මස්ඉඹුල",
    cover: "/images/books/senkottan.jpg",
    price: "Rs. 850.00",
    match: "92% Match",
    description: "A powerful Sinhala novel exploring family, memory, and the social changes that shape a community across generations.",
  },
  {
    id: "guru-geethaya",
    title: "ගුරු ගීතය",
    author: "චිංගීස් අයිත්මාතව්",
    cover: "/guru-geethaya.png",
    price: "Rs. 650.00",
    match: "88% Match",
    description: "A moving story of an idealistic teacher whose dedication gives a remote village's children a new way to imagine their future.",
  },
  {
    id: "madol-doova",
    title: "මඩොල් දූව",
    author: "මාර්ටින් වික්‍රමසිංහ",
    cover: "/MadolDoova.jpg",
    price: "Rs. 450.00",
    match: "85% Match",
    description: "An enduring coming-of-age adventure filled with friendship, courage, and the untamed freedom of island life.",
  },
  {
    id: "alimankada",
    title: "අලිමංකඩ",
    author: "නිහාල් ද සිල්වා",
    cover: "/MV5BZGE0ZTgyM2YtNzZjNy00MTE0LTlhYzItYmE5ZWMwYzZjOWU3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    price: "Rs. 950.00",
    match: "82% Match",
    description: "A tense and thoughtful novel about conflict, identity, and the human stories found along a divided road.",
  },
  {
    id: "amba-yahaluwo",
    title: "අඹ යහළුවෝ",
    author: "ටී. බී. ඉලංගරත්න",
    cover: "/images/books/amba_yahaluwo_new.jpg",
    price: "Rs. 500.00",
    match: "80% Match",
    description: "A warm, much-loved tale of childhood friendship, resilience, and the small moments that become lasting memories.",
  },
];

export function getFeaturedBook(id: string) {
  return featuredBooks.find((book) => book.id === id);
}
