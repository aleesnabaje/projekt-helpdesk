import "./globals.css";

export const metadata = {
  title: "Szkolny Helpdesk",
  description: "System zgłaszania usterek w szkole",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}