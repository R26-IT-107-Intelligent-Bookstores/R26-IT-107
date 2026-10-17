import BookDetailLoader from "@/components/emobooks/BookDetailLoader";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookDetailLoader key={id} id={id} />;
}
