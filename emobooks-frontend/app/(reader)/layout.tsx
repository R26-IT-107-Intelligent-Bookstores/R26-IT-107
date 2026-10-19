import EmoBooksProvider from "@/components/emobooks/EmoBooksProvider";
import ReaderShell from "@/components/emobooks/ReaderShell";
import "./emobooks.css";

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return <EmoBooksProvider><ReaderShell>{children}</ReaderShell></EmoBooksProvider>;
}
