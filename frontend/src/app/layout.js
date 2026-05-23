export const metadata = {
  title: "AI Headshot Generator",
  description: "Generate professional LinkedIn headshots with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0f0f10; }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
