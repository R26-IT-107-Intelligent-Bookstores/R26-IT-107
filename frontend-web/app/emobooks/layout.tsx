import MainNavbar from "@/components/MainNavbar";
import EmoBooksProvider from "@/components/emobooks/EmoBooksProvider";
import ReaderShell from "@/components/emobooks/ReaderShell";
import "./emobooks.css";

export default function EmoBooksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MainNavbar />
      <EmoBooksProvider>
        <ReaderShell>{children}</ReaderShell>
      </EmoBooksProvider>
    </>
  );
}
