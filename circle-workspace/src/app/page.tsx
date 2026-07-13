import StatCard from "@/components/StatCard";
import Sidebar from "@/components/Sidebar";
import TaskItem from "@/components/TaskItem";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10 bg-gray-100">
        <h1 className="text-4xl font-bold">
          おはようございます 👋
        </h1>

        <p className="text-gray-500 mt-2">
          今日も一日よろしくお願いします。
        </p>

        <div className="grid grid-cols-4 gap-6 mt-10">

          <StatCard
            title="期限超過"
            value={2}
            subtitle="件のタスク"
            color="text-red-500"
          />

          <StatCard
            title="進行中タスク"
            value={9}
            subtitle="件"
          />

          <StatCard
            title="進行中プロジェクト"
            value={7}
            subtitle="件"
          />

          <StatCard
            title="最近の議事録"
            value={4}
            subtitle="件"
          />

        </div>

        <div className="mt-10 bg-white rounded-2xl shadow-sm border p-6">

          <h2 className="text-xl font-bold mb-4">
            期限の近いタスク
          </h2>

          <TaskItem
            title="新早連への参加申請"
            category="渉外・新早連春"
            due="3日超過"
            color="bg-red-500"
          />

          <TaskItem
            title="練習スケジュール調整"
            category="プレマネ・エスパジオ春"
            due="1日超過"
            color="bg-red-500"
          />

          <TaskItem
            title="幹事会議の準備"
            category="幹事長・サークル共通"
            due="1日後"
            color="bg-blue-500"
          />

        </div>

      </div>
    </main>
  );
}
