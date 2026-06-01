import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "CampusPack | Shareable College & Hostel Essentials Checklists",
  description: "A premium, collaborative platform where incoming college students and seniors build public, shareable packing checklists with rate-limited anti-spam security.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
