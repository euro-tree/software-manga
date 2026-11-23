import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel — Your personal comics library",
  description: "A quiet place for the stories you keep.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
