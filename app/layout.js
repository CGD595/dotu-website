import "./globals.css";

export const metadata = {
  title: "Dotu — The Future of Dzongkha AI",
  description:
    "The first bidirectional English ↔ Dzonglish neural translation system, preserving Bhutanese language through multilingual AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var params = new URLSearchParams(window.location.search);
                var saved = window.localStorage.getItem("dotu-theme");
                var theme = params.get("theme") === "light" || saved === "light" ? "light" : "dark";
                document.documentElement.dataset.theme = theme;
              } catch (error) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
