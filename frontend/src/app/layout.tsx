import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Contributions · Worklog",
  description: "Browse and search team contributions.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}