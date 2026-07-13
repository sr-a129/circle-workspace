export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <h1 className="text-xl font-semibold">
        Circle Database
      </h1>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
          S
        </div>

        <span>さら</span>
      </div>
    </header>
  );
}