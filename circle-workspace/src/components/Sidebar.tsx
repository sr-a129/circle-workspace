import {
  Home,
  Users,
  Folder,
  CheckSquare,
  Calendar,
  FileText,
  BookOpen,
  Search,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0B1D51] text-white flex flex-col px-6 py-8">

      <p className="text-xs text-gray-400 mb-3">
        2026年度
      </p>

      <h1 className="text-3xl font-bold leading-tight mb-10">
        サークル
        <br />
        データベース
      </h1>

      <nav className="space-y-2">

        <MenuItem icon={<Home size={18} />} text="ダッシュボード" />

        <MenuItem icon={<Users size={18} />} text="役職" />

        <MenuItem icon={<Folder size={18} />} text="プロジェクト" />

        <MenuItem icon={<CheckSquare size={18} />} text="タスク" />

        <MenuItem icon={<Calendar size={18} />} text="年間計画" />

        <MenuItem icon={<FileText size={18} />} text="議事録" />

        <MenuItem icon={<BookOpen size={18} />} text="引き継ぎ" />

        <MenuItem icon={<Search size={18} />} text="検索" />

      </nav>

      <div className="mt-auto text-xs text-gray-500">
        v0.1
      </div>
    </aside>
  );
}

function MenuItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button
      className="
      flex
      items-center
      gap-3
      w-full
      rounded-xl
      px-3
      py-3
      hover:bg-white/10
      transition"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}