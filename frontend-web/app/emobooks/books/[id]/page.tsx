import BookDetailLoader from "@/components/emobooks/BookDetailLoader";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookDetailLoader id={id} />;
}
