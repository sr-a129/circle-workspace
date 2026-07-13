import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen">

          <Sidebar />

          <div className="flex-1 flex flex-col">

            <Header />

            <main className="flex-1 bg-gray-100 p-8">
              {children}
            </main>

          </div>

        </div>
      </body>
    </html>
  );
}
