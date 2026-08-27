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
    id: "viragaya",
    title: "විරාගය",
    author: "අරවින්ද දිසානායක",
    cover: "/viragaya.jpg",
    price: "Rs. 850.00",
    match: "92% Match",
    description: "A reflective Sinhala classic about love, detachment, and the quiet inner journeys that shape a life.",
  },
  {
    id: "gamperaliya",
    title: "ගම්පෙරළිය",
    author: "මාර්ටින් වික්‍රමසිංහ",
    cover: "/gamperaliya.jpg",
    price: "Rs. 750.00",
    match: "89% Match",
    description: "A landmark Sinhala novel tracing a family and a village through social change, ambition, and a changing way of life.",
  },
  {
    id: "harry-potter",
    title: "හැරී පොටර්",
    author: "ජේ. කේ. රෝලිං",
    cover: "/harry-potter.jpg",
    price: "Rs. 1,250.00",
    match: "87% Match",
    description: "A young wizard discovers friendship, courage, and a world of possibility while beginning his extraordinary journey.",
  },
  {
    id: "1925",
    title: "1925",
    author: "ශ්‍රී ලාංකීය සාහිත්‍ය එකතුව",
    cover: "/1925.jpg",
    price: "Rs. 900.00",
    match: "84% Match",
    description: "A richly atmospheric historical story that brings an important time in Sri Lanka's past into vivid focus.",
  },
  {
    id: "monara-pile-shapaya",
    title: "මොනර පිළේ ශාපය",
    author: "ශ්‍රී ලාංකීය කතා එකතුව",
    cover: "/monara-pile.jpg",
    price: "Rs. 700.00",
    match: "81% Match",
    description: "A suspenseful Sinhala tale of mystery, hidden histories, and the curse that follows an unforgettable discovery.",
  },
];

export function getFeaturedBook(id: string) {
  return featuredBooks.find((book) => book.id === id);
}
