import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Listron | Public Shareable Packing Checklists",
  description: "A premium, collaborative platform where incoming college students and seniors build public, shareable packing checklists with rate-limited anti-spam security.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fffafb] text-slate-900 selection:bg-rose-500/10 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
