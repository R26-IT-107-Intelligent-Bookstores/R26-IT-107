import MainNavbar from "@/components/MainNavbar";
import EmoBooksProvider from "@/components/emobooks/EmoBooksProvider";
import EmoBooksShell from "@/components/emobooks/EmoBooksShell";
import "./emobooks.css";

export default function EmoBooksLayout({ children }: { children: React.ReactNode }) {
  return <><MainNavbar /><EmoBooksProvider><EmoBooksShell>{children}</EmoBooksShell></EmoBooksProvider></>;
}
