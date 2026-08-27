export type FeaturedBook = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover: string;
  price: string;
  match: string;
  description: string;
};

export const featuredBooks: FeaturedBook[] = [
  {
    id: "viragaya",
    title: "විරාගය",
    author: "අරවින්ද දිසානායක",
    isbn: "9789556682052",
    cover: "/viragaya.jpg",
    price: "Rs. 850.00",
    match: "92% Match",
    description: "A reflective Sinhala classic about love, detachment, and the quiet inner journeys that shape a life.",
  },
  {
    id: "gamperaliya",
    title: "ගම්පෙරළිය",
    author: "මාර්ටින් වික්‍රමසිංහ",
    isbn: "9789556682045",
    cover: "/gamperaliya.jpg",
    price: "Rs. 750.00",
    match: "89% Match",
    description: "A landmark Sinhala novel tracing a family and a village through social change, ambition, and a changing way of life.",
  },
  {
    id: "harry-potter",
    title: "හැරී පොටර්",
    author: "ජේ. කේ. රෝලිං",
    isbn: "955-573-484-4",
    cover: "/harry-potter.jpg",
    price: "Rs. 1,250.00",
    match: "87% Match",
    description: "A young wizard discovers friendship, courage, and a world of possibility while beginning his extraordinary journey.",
  },
  {
    id: "1925",
    title: "1925",
    author: "ශ්‍රී ලාංකීය සාහිත්‍ය එකතුව",
    isbn: "978-955-3727-66-4",
    cover: "/1925.jpg",
    price: "Rs. 900.00",
    match: "84% Match",
    description: "A richly atmospheric historical story that brings an important time in Sri Lanka's past into vivid focus.",
  },
  {
    id: "monara-pile-shapaya",
    title: "මොනර පිළේ ශාපය",
    author: "ශ්‍රී ලාංකීය කතා එකතුව",
    isbn: "978-955-697-197-2",
    cover: "/monara-pile.jpg",
    price: "Rs. 700.00",
    match: "81% Match",
    description: "A suspenseful Sinhala tale of mystery, hidden histories, and the curse that follows an unforgettable discovery.",
  },
  {
    id: "madol-doova",
    title: "මඩොල් දූව",
    author: "මාර්ටින් වික්‍රමසිංහ",
    isbn: "9789555232310",
    cover: "/images/books/madol_doova.jpg",
    price: "Rs. 650.00",
    match: "86% Match",
    description: "An enduring coming-of-age adventure filled with friendship, courage, and the untamed freedom of island life.",
  },
  {
    id: "senkottan",
    title: "සෙන්කොට්ටං",
    author: "මහින්ද ප්‍රසාද් මස්ඉඹුල",
    isbn: "Not listed in source",
    cover: "/images/books/senkottan.jpg",
    price: "Rs. 850.00",
    match: "85% Match",
    description: "A powerful Sinhala novel exploring family, memory, and the social changes that shape a community across generations.",
  },
  {
    id: "amba-yahaluwo",
    title: "අඹ යහළුවෝ",
    author: "ටී. බී. ඉලංගරත්න",
    isbn: "Not listed in source",
    cover: "/images/books/amba_yahaluwo_new.jpg",
    price: "Rs. 500.00",
    match: "83% Match",
    description: "A warm, much-loved tale of childhood friendship, resilience, and the small moments that become lasting memories.",
  },
  {
    id: "sadaadaraniya-kemiliya",
    title: "සදාදරණීය කෙමීලියා",
    author: "ශ්‍රී ලාංකීය සාහිත්‍ය එකතුව",
    isbn: "Not listed in source",
    cover: "/images/books/sadaadaraniya_kemiliya.jpg",
    price: "Rs. 780.00",
    match: "79% Match",
    description: "A tender and atmospheric story about devotion, difficult choices, and the memories that refuse to fade.",
  },
  {
    id: "kaliyugaya",
    title: "කලියුගය",
    author: "මාර්ටින් වික්‍රමසිංහ",
    isbn: "9789550201389",
    cover: "/images/books/kaliyugaya.jpg",
    price: "Rs. 820.00",
    match: "78% Match",
    description: "A thoughtful literary journey through a society in transition, balancing tradition, modern life, and personal identity.",
  },
];

export function getFeaturedBook(id: string) {
  return featuredBooks.find((book) => book.id === id);
}
