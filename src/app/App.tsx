import { useState, useMemo, useEffect } from "react";
import {
  Home, Users, FolderOpen, CheckSquare, Calendar,
  FileText, BookOpen, Layout, HelpCircle, Search,
  ChevronRight, AlertTriangle, ArrowLeft, X, Menu,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type View =
  | "dashboard" | "roles" | "role-detail"
  | "projects" | "project-detail"
  | "tasks" | "annual" | "minutes"
  | "handoff" | "templates" | "faq" | "search";

type TaskStatus = "overdue" | "in-progress" | "todo" | "completed";
type TaskPriority = "high" | "medium" | "low";
type ProjectStatus = "active" | "planning" | "completed";
type RoleTab = "overview" | "tasks" | "minutes" | "handoff";
type ProjTab = "overview" | "tasks" | "minutes" | "handoff";
type TaskFilter = "all" | "today" | "week" | "overdue" | "completed";

// ─── Data ────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "kanjicho", name: "幹事長", emoji: "👑", member: "山田 太郎", year: "4年",
    description: "サークル全体の運営を統括し、方針決定と各役職の調整を行う。",
    annualFlow: ["4月：新歓全体統括", "5月：予算方針決定", "6月：大会準備指揮", "8月：合宿総指揮", "3月：年間振り返り・引き継ぎ準備"],
    duties: ["全体方針の策定と決定", "幹事会議の主催・進行", "各役職の連携調整", "外部団体との代表折衝", "後継者の育成・選定"],
  },
  {
    id: "hosa", name: "幹事長補佐", emoji: "🤝", member: "佐藤 花子", year: "3年",
    description: "幹事長のサポートを行い、各役職の横断的な情報共有を促進する。",
    annualFlow: ["4月：新歓補佐", "6月：連絡系統整理", "8月：合宿補佐", "11月：秋学期の振り返り", "3月：引き継ぎ資料作成"],
    duties: ["幹事長の補佐・代行", "各役職間の情報共有", "スケジュール管理", "議事録の作成・管理", "連絡系統の整備"],
  },
  {
    id: "kaikei", name: "会計", emoji: "💰", member: "田中 雄大", year: "3年",
    description: "サークルの収支を管理し、イベントごとの予算策定と精算を担当する。",
    annualFlow: ["4月：年間予算策定", "各イベント前：予算案作成", "各イベント後：精算処理", "月次：収支報告", "3月：年間決算報告"],
    duties: ["年間予算の策定・管理", "イベント費用の精算", "月次収支報告書の作成", "部費の徴収・管理", "銀行口座の管理"],
  },
  {
    id: "kikaku", name: "企画", emoji: "💡", member: "鈴木 めぐみ", year: "3年",
    description: "イベントの企画立案から運営まで、コンテンツ面の責任者として活動する。",
    annualFlow: ["3月：新年度企画立案", "4月：新歓企画・運営", "5月：Tシャツデザイン", "6月：演奏会企画", "8月：合宿プログラム"],
    duties: ["年間イベント企画", "Tシャツ・グッズ制作", "演奏会プログラム編成", "新歓コンテンツ企画", "参加者アンケート分析"],
  },
  {
    id: "preman", name: "プレマネ", emoji: "🏃", member: "中村 大輔", year: "3年",
    description: "プレイヤーマネージャーとして、練習スケジュールと選手のコンディション管理を担う。",
    annualFlow: ["4月：新入生受け入れ", "通年：練習スケジュール管理", "大会前：選手調整", "合宿：練習メニュー作成", "3月：来年度計画"],
    duties: ["練習スケジュールの管理", "選手のコンディション管理", "大会エントリー手続き", "練習場所の確保", "新入生の育成計画"],
  },
  {
    id: "shokai", name: "渉外", emoji: "🌐", member: "小林 あい", year: "2年",
    description: "他団体・会場・業者との交渉や連絡調整を一手に担う対外窓口。",
    annualFlow: ["4月：関係団体への挨拶", "随時：会場予約・業者交渉", "大会前：参加申請", "合宿前：施設・移動手配", "3月：次年度の関係構築"],
    duties: ["他団体との連絡調整", "会場予約・手配", "業者への発注・交渉", "大会申請・エントリー", "レンタカー・宿泊の手配"],
  },
] as const;

const PROJECTS: {
  id: string; name: string; month: number; status: ProjectStatus;
  roles: string[]; description: string; tasks_count: number; tasks_done: number;
}[] = [
  { id: "shinkan", name: "新歓", month: 4, status: "completed", roles: ["kanjicho", "kikaku", "preman"], description: "新入生歓迎イベント。毎年4月に開催し、新入部員の獲得を目的とする。", tasks_count: 12, tasks_done: 12 },
  { id: "tshirt", name: "Tシャツ制作", month: 5, status: "completed", roles: ["kikaku"], description: "年次サークルTシャツのデザイン選定・発注・配布。", tasks_count: 8, tasks_done: 8 },
  { id: "shinsorenspring", name: "新早連春", month: 6, status: "active", roles: ["shokai", "preman"], description: "新早稲田連合春季大会への参加。", tasks_count: 6, tasks_done: 2 },
  { id: "espaiospring", name: "エスパジオ春", month: 6, status: "active", roles: ["kikaku", "shokai", "kaikei"], description: "春季定期演奏会。ホールを借りて行う年間最大イベントのひとつ。", tasks_count: 10, tasks_done: 3 },
  { id: "summer", name: "夏合宿", month: 8, status: "planning", roles: ["kanjicho", "kaikei", "shokai", "kikaku"], description: "夏季強化合宿。宿泊施設での集中練習と親睦イベントを実施。", tasks_count: 15, tasks_done: 2 },
  { id: "espaifall", name: "エスパジオ秋", month: 10, status: "planning", roles: ["kikaku", "shokai", "kaikei"], description: "秋季定期演奏会。", tasks_count: 10, tasks_done: 0 },
  { id: "shinsorenfall", name: "新早連秋", month: 11, status: "planning", roles: ["shokai", "preman"], description: "新早稲田連合秋季大会への参加。", tasks_count: 6, tasks_done: 0 },
  { id: "ski", name: "スキースノボ合宿", month: 1, status: "planning", roles: ["kikaku", "kaikei"], description: "冬季スキー・スノーボード合宿。", tasks_count: 8, tasks_done: 0 },
  { id: "springcamp", name: "春合宿", month: 3, status: "planning", roles: ["kanjicho", "kaikei"], description: "春季強化合宿および年度締めイベント。", tasks_count: 10, tasks_done: 0 },
];

const TASKS: {
  id: number; title: string; project: string | null; role: string;
  assignee: string; deadline: string; priority: TaskPriority; status: TaskStatus;
}[] = [
  { id: 1, title: "会場予約の確認", project: "summer", role: "shokai", assignee: "小林 あい", deadline: "2026-07-15", priority: "high", status: "in-progress" },
  { id: 2, title: "予算案の提出", project: "summer", role: "kaikei", assignee: "田中 雄大", deadline: "2026-07-18", priority: "high", status: "in-progress" },
  { id: 3, title: "参加者名簿の作成", project: "summer", role: "hosa", assignee: "佐藤 花子", deadline: "2026-07-20", priority: "medium", status: "todo" },
  { id: 4, title: "レンタカー業者への連絡", project: "summer", role: "shokai", assignee: "小林 あい", deadline: "2026-07-25", priority: "medium", status: "todo" },
  { id: 5, title: "新早連への参加申請", project: "shinsorenspring", role: "shokai", assignee: "小林 あい", deadline: "2026-07-10", priority: "high", status: "overdue" },
  { id: 6, title: "練習スケジュール調整", project: "espaiospring", role: "preman", assignee: "中村 大輔", deadline: "2026-07-12", priority: "medium", status: "overdue" },
  { id: 7, title: "ホール使用許可申請", project: "espaiospring", role: "shokai", assignee: "小林 あい", deadline: "2026-07-30", priority: "low", status: "todo" },
  { id: 8, title: "月次収支報告", project: null, role: "kaikei", assignee: "田中 雄大", deadline: "2026-07-31", priority: "medium", status: "todo" },
  { id: 9, title: "幹事会議の準備", project: null, role: "kanjicho", assignee: "山田 太郎", deadline: "2026-07-14", priority: "high", status: "in-progress" },
  { id: 10, title: "Tシャツデザイン確認", project: "tshirt", role: "kikaku", assignee: "鈴木 めぐみ", deadline: "2026-05-30", priority: "high", status: "completed" },
  { id: 11, title: "エスパジオ演目選定", project: "espaiospring", role: "kikaku", assignee: "鈴木 めぐみ", deadline: "2026-07-20", priority: "medium", status: "todo" },
  { id: 12, title: "宿泊施設の仮予約", project: "summer", role: "shokai", assignee: "小林 あい", deadline: "2026-07-22", priority: "high", status: "todo" },
];

const MINUTES = [
  { id: 1, title: "幹事会議 第5回", date: "2026-07-08", role: "kanjicho", project: null as string | null, summary: "夏合宿の日程・予算・担当割り当てについて協議。宿泊施設の候補3件を確認し、来週までに絞り込む方針で合意。" },
  { id: 2, title: "夏合宿準備MTG #2", date: "2026-07-05", role: null as string | null, project: "summer", summary: "レンタカー手配方法と費用分担について議論。昨年の改善点を参考に、今年は早期予約を実施する方針を決定。" },
  { id: 3, title: "エスパジオ春 制作会議", date: "2026-07-01", role: null as string | null, project: "espaiospring", summary: "演目リスト最終確認。プログラムの印刷業者の選定を渉外に依頼。開演時刻を19:00に変更で合意。" },
  { id: 4, title: "幹事会議 第4回", date: "2026-06-24", role: "kanjicho", project: null as string | null, summary: "前期の収支報告・各役職からの活動報告・新早連春の振り返りを実施。後期計画の骨子を確認。" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-07-13";

function getRoleName(id: string | null) {
  if (!id) return "—";
  return ROLES.find((r) => r.id === id)?.name ?? id;
}

function getProjectName(id: string | null) {
  if (!id) return "サークル共通";
  return PROJECTS.find((p) => p.id === id)?.name ?? id;
}

function getMonthEmoji(month: number) {
  const map: Record<number, string> = { 4: "🌸", 5: "👕", 6: "🎵", 7: "🌅", 8: "🏕️", 9: "🍃", 10: "🍂", 11: "🏆", 12: "❄️", 1: "⛷️", 2: "🌨️", 3: "🌱" };
  return map[month] ?? "📅";
}

function getDaysDiff(iso: string) {
  const today = new Date(TODAY);
  const target = new Date(iso);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_CFG: Record<TaskStatus, { label: string; bg: string; text: string; dot: string }> = {
  overdue:     { label: "期限超過", bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
  "in-progress":{ label: "進行中",   bg: "bg-blue-50",  text: "text-blue-700",  dot: "bg-blue-500" },
  todo:        { label: "未着手",   bg: "bg-gray-100", text: "text-gray-600",  dot: "bg-gray-400" },
  completed:   { label: "完了",     bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  high:   { label: "高", color: "text-red-600" },
  medium: { label: "中", color: "text-amber-600" },
  low:    { label: "低", color: "text-gray-400" },
};

const PROJECT_STATUS_CFG: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  completed: { label: "完了",   bg: "bg-green-50", text: "text-green-700" },
  active:    { label: "進行中", bg: "bg-blue-50",  text: "text-blue-700" },
  planning:  { label: "計画中", bg: "bg-amber-50", text: "text-amber-700" },
};

const MONTHS_LABEL = ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"];
const MONTHS_NUM   = [4,5,6,7,8,9,10,11,12,1,2,3];

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_PRIMARY: { id: View; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "dashboard", label: "ダッシュボード", Icon: Home },
  { id: "roles",     label: "役職",           Icon: Users },
  { id: "projects",  label: "プロジェクト",   Icon: FolderOpen },
  { id: "tasks",     label: "タスク",         Icon: CheckSquare },
  { id: "annual",    label: "年間計画",       Icon: Calendar },
];

const NAV_SECONDARY: { id: View; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "minutes",   label: "議事録",         Icon: FileText },
  { id: "handoff",   label: "引き継ぎ",       Icon: BookOpen },
  { id: "templates", label: "テンプレート",   Icon: Layout },
  { id: "faq",       label: "FAQ",            Icon: HelpCircle },
  { id: "search",    label: "検索",           Icon: Search },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
}: {
  view: View;
  onNavigate: (v: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  function isActive(id: View) {
    if (id === "roles")    return view === "roles" || view === "role-detail";
    if (id === "projects") return view === "projects" || view === "project-detail";
    return view === id;
  }

  function handleNav(v: View) {
    onNavigate(v);
    onClose();
  }

  const navContent = (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-primary-foreground/30 uppercase tracking-[0.18em] mb-1.5">2026年度</div>
          <h1 className="text-base font-semibold text-primary-foreground leading-snug">
            サークル<br/>データベース
          </h1>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-primary-foreground/50 hover:text-primary-foreground mt-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV_PRIMARY.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
              isActive(id)
                ? "bg-white/15 text-primary-foreground"
                : "text-primary-foreground/55 hover:text-primary-foreground hover:bg-white/8"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}

        <div className="my-2.5 border-t border-white/10" />

        {NAV_SECONDARY.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
              isActive(id)
                ? "bg-white/15 text-primary-foreground"
                : "text-primary-foreground/55 hover:text-primary-foreground hover:bg-white/8"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-primary-foreground/25">v0.1 — 内部利用</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-primary flex-col flex-shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-64 bg-primary flex flex-col h-full shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  const overdueTasks   = TASKS.filter((t) => t.status === "overdue");
  const activeTasks    = TASKS.filter((t) => t.status === "in-progress" || t.status === "todo");
  const activeProjects = PROJECTS.filter((p) => p.status === "active" || p.status === "planning");

  const urgentTasks = TASKS
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-muted-foreground tracking-wider mb-1.5">2026年7月13日（月）</p>
        <h1 className="text-2xl font-semibold tracking-tight">おはようございます 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">今日も一日よろしくお願いします。</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {[
          { label: "期限超過", value: overdueTasks.length, sub: "件のタスク", valueClass: "text-red-600" },
          { label: "進行中タスク", value: activeTasks.length, sub: "件", valueClass: "" },
          { label: "進行中プロジェクト", value: activeProjects.length, sub: "件", valueClass: "text-blue-700" },
          { label: "最近の議事録", value: MINUTES.length, sub: "件", valueClass: "" },
        ].map(({ label, value, sub, valueClass }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 md:p-5">
            <div className="text-xs text-muted-foreground mb-2">{label}</div>
            <div className={`text-3xl font-semibold ${valueClass}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Task list */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="font-semibold text-sm">期限の近いタスク</h2>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                全て見る <ChevronRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-border">
              {urgentTasks.map((task) => {
                const sc = STATUS_CFG[task.status];
                const diff = getDaysDiff(task.deadline);
                return (
                  <div key={task.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRoleName(task.role)} · {getProjectName(task.project)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xs font-medium ${diff < 0 ? "text-red-600" : diff <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {diff < 0 ? `${Math.abs(diff)}日超過` : diff === 0 ? "今日" : `${diff}日後`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{task.assignee}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">最近の議事録</h3>
            </div>
            <div className="divide-y divide-border">
              {MINUTES.slice(0, 3).map((m) => (
                <div key={m.id} className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="text-xs font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">進行中プロジェクト</h3>
            </div>
            <div className="divide-y divide-border">
              {PROJECTS.filter((p) => p.status === "active").map((p) => {
                const pct = Math.round((p.tasks_done / p.tasks_count) * 100);
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate("project-detail", p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-xs font-medium">{p.name}</div>
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {p.tasks_done}/{p.tasks_count} タスク完了
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Roles List ──────────────────────────────────────────────────────────────

function RolesList({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">役職</h1>
        <p className="text-muted-foreground mt-1 text-sm">各役職の仕事内容と担当者。全員が閲覧できます。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const roleTasks = TASKS.filter((t) => t.role === role.id && t.status !== "completed");
          const overdueCount = roleTasks.filter((t) => t.status === "overdue").length;
          return (
            <button
              key={role.id}
              onClick={() => onNavigate("role-detail", role.id)}
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{role.emoji}</span>
                <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
              </div>
              <div className="font-semibold mb-0.5">{role.name}</div>
              <div className="text-sm text-muted-foreground mb-3">{role.member} · {role.year}</div>
              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{role.description}</div>
              {overdueCount > 0 && (
                <div className="mt-3 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle size={11} /> {overdueCount}件 期限超過
                </div>
              )}
              {overdueCount === 0 && roleTasks.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">{roleTasks.length}件のタスクが進行中</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Role Detail ─────────────────────────────────────────────────────────────

function RoleDetail({ roleId, onBack, onNavigate }: {
  roleId: string;
  onBack: () => void;
  onNavigate: (v: View, id?: string) => void;
}) {
  const [tab, setTab] = useState<RoleTab>("overview");
  const role = ROLES.find((r) => r.id === roleId)!;
  const roleTasks = TASKS.filter((t) => t.role === roleId);
  const relatedProjects = PROJECTS.filter((p) => p.roles.includes(roleId));
  const roleMinutes = MINUTES.filter(
    (m) => m.role === roleId || relatedProjects.some((p) => p.id === m.project)
  );

  const TABS: [RoleTab, string][] = [
    ["overview", "概要"], ["tasks", "タスク"], ["minutes", "議事録"], ["handoff", "引き継ぎ"]
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> 役職一覧に戻る
      </button>

      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl">{role.emoji}</span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{role.name}</h1>
          <div className="text-muted-foreground text-sm mt-0.5">{role.member} · {role.year}</div>
        </div>
      </div>

      <div className="flex gap-0 mb-6 border-b border-border">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">仕事内容</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{role.description}</p>
              <ul className="space-y-2">
                {role.duties.map((d, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">年間の流れ</h3>
              <div className="space-y-2.5">
                {role.annualFlow.map((f, i) => {
                  const [month, ...rest] = f.split("：");
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono flex-shrink-0 mt-0.5 min-w-12 text-center">
                        {month}
                      </span>
                      <span className="leading-relaxed">{rest.join("：")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">関連プロジェクト</h3>
              <div className="space-y-1.5">
                {relatedProjects.map((p) => {
                  const sc = PROJECT_STATUS_CFG[p.status];
                  return (
                    <button
                      key={p.id}
                      onClick={() => onNavigate("project-detail", p.id)}
                      className="w-full text-left flex items-center justify-between py-1.5 hover:text-primary transition-colors"
                    >
                      <span className="text-sm">{p.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-1">タスク概況</h3>
              <div className="text-2xl font-semibold mt-2">
                {roleTasks.filter((t) => t.status !== "completed").length}
                <span className="text-sm font-normal text-muted-foreground ml-1">件 進行中</span>
              </div>
              {roleTasks.filter((t) => t.status === "overdue").length > 0 && (
                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {roleTasks.filter((t) => t.status === "overdue").length}件が期限超過
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {roleTasks.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">タスクはありません</div>
          ) : (
            <div className="divide-y divide-border">
              {roleTasks.map((task) => {
                const sc = STATUS_CFG[task.status];
                const pc = PRIORITY_CFG[task.priority];
                const diff = getDaysDiff(task.deadline);
                return (
                  <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{getProjectName(task.project)}</div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-xs font-medium ${pc.color}`}>{pc.label}優先</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <div className={`text-xs ${diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {diff < 0 ? `${Math.abs(diff)}日超過` : task.deadline}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "minutes" && (
        <div className="space-y-3">
          {roleMinutes.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">議事録はありません</div>
          ) : roleMinutes.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.date}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.summary}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "handoff" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">次年度への引き継ぎ（{role.name}）</h3>
          <div className="space-y-3 text-sm">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="font-medium text-amber-800 mb-1.5">⚠️ 改善点・注意事項</div>
              <p className="text-amber-700 text-xs leading-relaxed">引き継ぎ事項はまだ記入されていません。年度末に担当者が記入します。</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="font-medium text-blue-800 mb-1.5">📖 マニュアル・手順</div>
              <p className="text-blue-700 text-xs leading-relaxed">マニュアルはまだ作成されていません。</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="font-medium text-red-800 mb-1.5">❌ 失敗談</div>
              <p className="text-red-700 text-xs leading-relaxed">失敗談はまだ記録されていません。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Projects List ───────────────────────────────────────────────────────────

function ProjectsList({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">プロジェクト</h1>
        <p className="text-muted-foreground mt-1 text-sm">年間を通じた主要イベントと活動を管理します。</p>
      </div>

      <div className="space-y-2">
        {PROJECTS.map((p) => {
          const sc = PROJECT_STATUS_CFG[p.status];
          const pct = Math.round((p.tasks_done / p.tasks_count) * 100);
          return (
            <button
              key={p.id}
              onClick={() => onNavigate("project-detail", p.id)}
              className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/25 hover:shadow-sm transition-all group flex items-center gap-4"
            >
              <span className="text-2xl w-9 text-center flex-shrink-0">{getMonthEmoji(p.month)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{p.description}</div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1 bg-muted rounded-full overflow-hidden w-28">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{p.tasks_done}/{p.tasks_count}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right pr-1">
                <div className="text-xs text-muted-foreground mb-1">{p.month}月</div>
                <div className="text-xs text-muted-foreground">
                  {p.roles.map(getRoleName).join("・")}
                </div>
              </div>
              <ChevronRight size={15} className="text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Project Detail ──────────────────────────────────────────────────────────

function ProjectDetail({ projectId, onBack, onNavigate }: {
  projectId: string;
  onBack: () => void;
  onNavigate: (v: View, id?: string) => void;
}) {
  const [tab, setTab] = useState<ProjTab>("overview");
  const project = PROJECTS.find((p) => p.id === projectId)!;
  const projectTasks = TASKS.filter((t) => t.project === projectId);
  const projectMinutes = MINUTES.filter((m) => m.project === projectId);
  const sc = PROJECT_STATUS_CFG[project.status];
  const pct = Math.round((project.tasks_done / project.tasks_count) * 100);

  const TABS: [ProjTab, string][] = [
    ["overview", "概要"], ["tasks", "タスク"], ["minutes", "議事録"], ["handoff", "引き継ぎ"]
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> プロジェクト一覧に戻る
      </button>

      <div className="flex items-start gap-4 mb-6">
        <span className="text-5xl">{getMonthEmoji(project.month)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span className={`text-xs px-2 py-1 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
          </div>
          <p className="text-muted-foreground text-sm">{project.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden w-40">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm text-muted-foreground">
              {project.tasks_done}/{project.tasks_count} タスク完了（{pct}%）
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-0 mb-6 border-b border-border">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">開催概要</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex gap-6">
                  <dt className="text-muted-foreground w-24 flex-shrink-0">開催月</dt>
                  <dd>{project.month}月</dd>
                </div>
                <div className="flex gap-6">
                  <dt className="text-muted-foreground w-24 flex-shrink-0">ステータス</dt>
                  <dd><span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span></dd>
                </div>
                <div className="flex gap-6">
                  <dt className="text-muted-foreground w-24 flex-shrink-0">担当役職</dt>
                  <dd>{project.roles.map(getRoleName).join("・")}</dd>
                </div>
                <div className="flex gap-6">
                  <dt className="text-muted-foreground w-24 flex-shrink-0">進捗</dt>
                  <dd>{project.tasks_done}/{project.tasks_count} タスク完了</dd>
                </div>
              </dl>
            </div>
          </div>
          <div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">担当役職</h3>
              <div className="space-y-3">
                {project.roles.map((rid) => {
                  const role = ROLES.find((r) => r.id === rid)!;
                  return (
                    <button
                      key={rid}
                      onClick={() => onNavigate("role-detail", rid)}
                      className="w-full text-left flex items-center gap-2.5 hover:text-primary transition-colors"
                    >
                      <span className="text-lg">{role.emoji}</span>
                      <div>
                        <div className="text-sm font-medium">{role.name}</div>
                        <div className="text-xs text-muted-foreground">{role.member}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {projectTasks.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              このプロジェクトのタスクはまだ登録されていません
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projectTasks.map((task) => {
                const sc = STATUS_CFG[task.status];
                const pc = PRIORITY_CFG[task.priority];
                const diff = getDaysDiff(task.deadline);
                return (
                  <div key={task.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.assignee} · {getRoleName(task.role)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <div className={`text-xs min-w-20 text-right ${diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {diff < 0 ? `${Math.abs(diff)}日超過` : task.deadline}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "minutes" && (
        <div className="space-y-3">
          {projectMinutes.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">議事録はまだありません</div>
          ) : projectMinutes.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.date}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.summary}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "handoff" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">去年からの引き継ぎ</h3>
          {project.id === "summer" ? (
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="font-medium text-green-800 mb-1.5">✅ おすすめ</div>
                <p className="text-green-700 text-xs leading-relaxed">レンタカーは6月中に予約すること。7月になると希望の台数・車種が取れなくなる。昨年は苦労した。</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="font-medium text-amber-800 mb-1.5">⚠️ 注意事項</div>
                <p className="text-amber-700 text-xs leading-relaxed">宿泊施設への食事アレルギー申告は参加者名簿確定と同時に送ること。昨年は失念して直前対応が大変だった。</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="font-medium text-red-800 mb-1.5">❌ 失敗談</div>
                <p className="text-red-700 text-xs leading-relaxed">保険の加入手続きを出発3日前にしたところ、一部書類が間に合わなかった。出発2週間前には対応すること。</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">引き継ぎ事項はまだ記入されていません。年度末に担当者が記入します。</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tasks List ──────────────────────────────────────────────────────────────

function TasksList() {
  const [filter, setFilter]  = useState<TaskFilter>("all");
  const [roleFilter, setRoleFilter]    = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const todayDate = new Date(TODAY);
  const weekEndDate = new Date("2026-07-19");

  const filtered = useMemo(() => {
    return TASKS.filter((t) => {
      if (filter === "overdue")   return t.status === "overdue";
      if (filter === "completed") return t.status === "completed";
      if (filter === "today") {
        return new Date(t.deadline) <= todayDate && t.status !== "completed";
      }
      if (filter === "week") {
        return new Date(t.deadline) <= weekEndDate && t.status !== "completed" && t.status !== "overdue";
      }
      return true;
    })
      .filter((t) => roleFilter === "all" || t.role === roleFilter)
      .filter((t) => projectFilter === "all" || t.project === projectFilter);
  }, [filter, roleFilter, projectFilter]);

  const TABS: { id: TaskFilter; label: string; count: number }[] = [
    { id: "all",       label: "全て",   count: TASKS.length },
    { id: "overdue",   label: "遅延",   count: TASKS.filter((t) => t.status === "overdue").length },
    { id: "today",     label: "今日まで", count: TASKS.filter((t) => new Date(t.deadline) <= todayDate && t.status !== "completed").length },
    { id: "week",      label: "今週",   count: TASKS.filter((t) => new Date(t.deadline) <= weekEndDate && t.status !== "completed" && t.status !== "overdue").length },
    { id: "completed", label: "完了",   count: TASKS.filter((t) => t.status === "completed").length },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">タスク</h1>
        <p className="text-muted-foreground mt-1 text-sm">全プロジェクト・全役職のタスクを一覧表示します。</p>
      </div>

      <div className="flex gap-0 mb-4 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              filter === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                t.id === "overdue" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 mb-5">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="all">全役職</option>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          <option value="all">全プロジェクト</option>
          {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_60px_110px] text-xs text-muted-foreground font-medium px-5 py-3 border-b border-border bg-muted/40">
          <div>タスク名</div>
          <div>役職</div>
          <div>担当</div>
          <div>優先度</div>
          <div className="text-right">期限</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">該当するタスクはありません</div>
          ) : filtered.map((task) => {
            const sc = STATUS_CFG[task.status];
            const pc = PRIORITY_CFG[task.priority];
            const diff = getDaysDiff(task.deadline);
            return (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_120px_100px_60px_110px] px-5 py-3 items-center hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{getProjectName(task.project)}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{getRoleName(task.role)}</div>
                <div className="text-sm">{task.assignee}</div>
                <div className={`text-xs font-medium ${pc.color}`}>{pc.label}</div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${diff < 0 ? "text-red-600" : diff <= 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {diff < 0 ? `${Math.abs(diff)}日超過` : diff === 0 ? "今日" : task.deadline}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">該当するタスクはありません</div>
        ) : filtered.map((task) => {
          const sc = STATUS_CFG[task.status];
          const pc = PRIORITY_CFG[task.priority];
          const diff = getDaysDiff(task.deadline);
          return (
            <div key={task.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-2.5 mb-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${sc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{getProjectName(task.project)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pl-4.5 mt-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getRoleName(task.role)}</span>
                  <span>·</span>
                  <span>{task.assignee}</span>
                  <span>·</span>
                  <span className={`font-medium ${pc.color}`}>{pc.label}優先</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  <span className={`text-xs font-medium ${diff < 0 ? "text-red-600" : diff <= 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {diff < 0 ? `${Math.abs(diff)}日超過` : diff === 0 ? "今日" : task.deadline}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Annual Plan ─────────────────────────────────────────────────────────────

function AnnualPlan({ onNavigate }: { onNavigate: (v: View, id?: string) => void }) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">年間計画</h1>
        <p className="text-muted-foreground mt-1 text-sm">2025年4月〜2026年3月の年間スケジュール。</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MONTHS_NUM.map((month, i) => {
          const monthProjects = PROJECTS.filter((p) => p.month === month);
          const isCurrent = month === 7;
          return (
            <div
              key={month}
              className={`bg-card border rounded-xl p-4 ${
                isCurrent ? "border-primary ring-1 ring-primary/20" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`font-semibold text-sm flex items-center gap-2 ${isCurrent ? "text-primary" : ""}`}>
                  {MONTHS_LABEL[i]}
                  {isCurrent && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">今月</span>
                  )}
                </div>
                <span className="text-base">{getMonthEmoji(month)}</span>
              </div>
              {monthProjects.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 italic">イベントなし</div>
              ) : (
                <div className="space-y-2">
                  {monthProjects.map((p) => {
                    const sc = PROJECT_STATUS_CFG[p.status];
                    return (
                      <button
                        key={p.id}
                        onClick={() => onNavigate("project-detail", p.id)}
                        className="w-full text-left flex items-center justify-between gap-2 hover:text-primary transition-colors"
                      >
                        <span className="text-xs font-medium truncate flex-1">{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

function SearchView() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      roles:    ROLES.filter((r) =>
        r.name.includes(q) || r.member.includes(q) || r.description.includes(q) || r.duties.some((d) => d.includes(q))
      ),
      projects: PROJECTS.filter((p) => p.name.includes(q) || p.description.includes(q)),
      tasks:    TASKS.filter((t) => t.title.toLowerCase().includes(q) || t.assignee.includes(q)),
      minutes:  MINUTES.filter((m) => m.title.includes(q) || m.summary.includes(q)),
    };
  }, [query]);

  const total = results ? results.roles.length + results.projects.length + results.tasks.length + results.minutes.length : 0;

  const SUGGESTIONS = ["レンタカー", "夏合宿", "会計", "演奏会", "新入生", "議事録"];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">検索</h1>
        <p className="text-muted-foreground mt-1 text-sm">役職・プロジェクト・タスク・議事録を横断検索します。</p>
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワードを入力（例：レンタカー、合宿、会計）"
          className="w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!results && (
        <div className="text-center py-14 text-muted-foreground">
          <Search size={36} className="mx-auto mb-3 opacity-15" />
          <p className="text-sm mb-5">キーワードを入力して検索</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="text-xs px-3 py-1.5 bg-card border border-border rounded-full hover:border-primary/30 hover:text-primary transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {results && total === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          「{query}」に一致する結果がありませんでした。
        </div>
      )}

      {results && total > 0 && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">{total}件の結果</p>

          {results.roles.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">役職</div>
              <div className="space-y-1.5">
                {results.roles.map((r) => (
                  <div key={r.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.member}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.projects.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">プロジェクト</div>
              <div className="space-y-1.5">
                {results.projects.map((p) => {
                  const sc = PROJECT_STATUS_CFG[p.status];
                  return (
                    <div key={p.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">{getMonthEmoji(p.month)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {results.tasks.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">タスク</div>
              <div className="space-y-1.5">
                {results.tasks.map((t) => {
                  const sc = STATUS_CFG[t.status];
                  return (
                    <div key={t.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.assignee} · {getRoleName(t.role)}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {results.minutes.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">議事録</div>
              <div className="space-y-1.5">
                {results.minutes.map((m) => (
                  <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.date}</div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm">この機能は近日公開予定です。</p>
      </div>
    </div>
  );
}

// ─── Mobile Header ───────────────────────────────────────────────────────────

const VIEW_LABELS: Partial<Record<View, string>> = {
  dashboard: "ダッシュボード",
  roles: "役職",
  "role-detail": "役職",
  projects: "プロジェクト",
  "project-detail": "プロジェクト",
  tasks: "タスク",
  annual: "年間計画",
  minutes: "議事録",
  handoff: "引き継ぎ",
  templates: "テンプレート",
  faq: "FAQ",
  search: "検索",
};

function MobileHeader({ view, onMenuOpen }: { view: View; onMenuOpen: () => void }) {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3 shadow-sm">
      <button
        onClick={onMenuOpen}
        className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
      >
        <Menu size={20} />
      </button>
      <span className="font-semibold text-sm">{VIEW_LABELS[view] ?? ""}</span>
    </header>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView]               = useState<View>("dashboard");
  const [selectedRole, setSelectedRole]       = useState("kanjicho");
  const [selectedProject, setSelectedProject] = useState("summer");
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function navigate(newView: View, id?: string) {
    setView(newView);
    if (newView === "role-detail"    && id) setSelectedRole(id);
    if (newView === "project-detail" && id) setSelectedProject(id);
  }

  return (
    <div
      className="flex h-screen bg-background"
      style={{ fontFamily: "'Noto Sans JP', Inter, system-ui, sans-serif" }}
    >
      <Sidebar
        view={view}
        onNavigate={(v) => navigate(v)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader view={view} onMenuOpen={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {view === "dashboard"      && <Dashboard onNavigate={navigate} />}
          {view === "roles"          && <RolesList onNavigate={navigate} />}
          {view === "role-detail"    && (
            <RoleDetail
              key={selectedRole}
              roleId={selectedRole}
              onBack={() => setView("roles")}
              onNavigate={navigate}
            />
          )}
          {view === "projects"       && <ProjectsList onNavigate={navigate} />}
          {view === "project-detail" && (
            <ProjectDetail
              key={selectedProject}
              projectId={selectedProject}
              onBack={() => setView("projects")}
              onNavigate={navigate}
            />
          )}
          {view === "tasks"          && <TasksList />}
          {view === "annual"         && <AnnualPlan onNavigate={navigate} />}
          {view === "minutes"        && <PlaceholderView title="議事録" />}
          {view === "handoff"        && <PlaceholderView title="引き継ぎ" />}
          {view === "templates"      && <PlaceholderView title="テンプレート" />}
          {view === "faq"            && <PlaceholderView title="FAQ" />}
          {view === "search"         && <SearchView />}
        </main>
      </div>
    </div>
  );
}
