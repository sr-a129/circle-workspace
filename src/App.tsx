import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Home, Users, FolderOpen, CheckSquare, Calendar,
  FileText, BookOpen, Layout, HelpCircle, Search,
  ChevronRight, ArrowLeft, X, Menu, Plus, CheckCircle2, Circle, Edit3, Save,
  ExternalLink, Paperclip, Trash2, FolderPlus, Cloud, CloudOff
} from "lucide-react";

// ─── Supabase Client Setup ───────────────────────────────────────────────────
const SUPABASE_URL = "https://mgdlfihyrcownopqvabx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCzd8PtOp7rI3wpt9tC_UQ_YHToUwJn";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

interface HandoffFile {
  id: string;
  title: string;
  fileType: "PDF" | "Word" | "Excel/Sheets" | "その他";
  url: string;
}

interface Role {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  description: string;
  annualFlow: string[];
  duties: string[];
  handoffNotes: string;
  handoffManual: string;
  handoffFiles: HandoffFile[];
}

interface Task {
  id: number;
  title: string;
  project: string | null;
  roles: string[];
  assignee: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface Project {
  id: string;
  name: string;
  month: number;
  status: ProjectStatus;
  roles: string[];
  description: string;
  handoffNotes: string;
  handoffFiles: HandoffFile[];
}

interface Minute {
  id: number;
  title: string;
  date: string;
  roles: string[];
  project: string | null;
  summary: string;
}

interface YearDataset {
  roles: Role[];
  projects: Project[];
  tasks: Task[];
  minutes: Minute[];
}

// ─── Initial Data ────────────────────────────────────────────────────────────

const INITIAL_ROLES: Role[] = [
  {
    id: "kanjicho", name: "幹事長", emoji: "👑", members: ["山田 太郎", "佐藤 花子"],
    description: "サークル全体の運営を統括し、方針決定と各役職の調整を行う。",
    annualFlow: ["4月：新歓全体統括", "5月：予算方針決定", "6月：大会準備指揮", "8月：合宿総指揮", "3月：年間振り返り・引き継ぎ準備"],
    duties: ["全体方針の策定と決定", "幹事会議の主催・進行", "各役職の連携調整", "外部団体との代表折衝", "後継者の育成・選定"],
    handoffNotes: "・新歓期は各役職のタスクが集中するため、週1回の進捗確認MTGを設けるとスムーズです。",
    handoffManual: "1. 幹事会議の議題を前日までに共有\n2. 決定事項は議事録に残し全体へ周知",
    handoffFiles: []
  },
  {
    id: "hosa", name: "幹事長補佐", emoji: "🤝", members: ["鈴木 一郎", "高橋 美咲"],
    description: "幹事長のサポートを行い、各役職の横断的な情報共有を促進する。",
    annualFlow: ["4月：新歓補佐", "6月：連絡系統整理", "8月：合宿補佐", "11月：秋学期の振り返り", "3月：引き継ぎ資料作成"],
    duties: ["幹事長の補佐・代行", "各役職間の情報共有", "スケジュール管理", "議事録の作成・管理", "連絡系統の整備"],
    handoffNotes: "", handoffManual: "", handoffFiles: []
  },
  {
    id: "kaikei", name: "会計", emoji: "💰", members: ["田中 雄大", "渡辺 健太"],
    description: "サークルの収支を管理し、イベントごとの予算策定と精算を担当する。",
    annualFlow: ["4月：年間予算策定", "各イベント前：予算案作成", "各イベント後：精算処理", "月次：収支報告", "3月：年間決算報告"],
    duties: ["年間予算の策定・管理", "イベント費用の精算", "月次収支報告書の作成", "部費の徴収・管理", "銀行口座の管理"],
    handoffNotes: "", handoffManual: "", handoffFiles: []
  },
  {
    id: "kikaku", name: "企画", emoji: "💡", members: ["鈴木 めぐみ", "伊藤 玲奈"],
    description: "イベントの企画立案から運営まで、コンテンツ面の責任者として活動する。",
    annualFlow: ["3月：新年度企画立案", "4月：新歓企画・運営", "5月：Tシャツデザイン", "6月：演奏会企画", "8月：合宿プログラム"],
    duties: ["年間イベント企画", "Tシャツ・グッズ制作", "演奏会プログラム編成", "新歓コンテンツ企画", "参加者アンケート分析"],
    handoffNotes: "", handoffManual: "", handoffFiles: []
  },
  {
    id: "preman", name: "プレマネ", emoji: "🏃", members: ["中村 大輔", "小川 翔"],
    description: "プレイヤーマネージャーとして、練習スケジュールと選手のコンディション管理を担う。",
    annualFlow: ["4月：新入生受け入れ", "通年：練習スケジュール管理", "大会前：選手調整", "合宿：練習メニュー作成", "3月：来年度計画"],
    duties: ["練習スケジュールの管理", "選手のコンディション管理", "大会エントリー手続き", "練習場所の確保", "新入生の育成計画"],
    handoffNotes: "", handoffManual: "", handoffFiles: []
  },
  {
    id: "shokai", name: "渉外", emoji: "🌐", members: ["小林 あい", "加藤 蓮"],
    description: "他団体・会場・業者との交渉や連絡調整を一手に担う対外窓口。",
    annualFlow: ["4月：関係団体への挨拶", "随時：会場予約・業者交渉", "大会前：参加申請", "合宿前：施設・移動手配", "3月：次年度の関係構築"],
    duties: ["他団体との連絡調整", "会場予約・手配", "業者への発注・交渉", "大会申請・エントリー", "レンタカー・宿泊の手配"],
    handoffNotes: "", handoffManual: "", handoffFiles: []
  },
];

const INITIAL_PROJECTS: Project[] = [
  { id: "shinkan", name: "新歓", month: 4, status: "completed", roles: ["kanjicho", "kikaku", "preman"], description: "新入生歓迎イベント。", handoffNotes: "", handoffFiles: [] },
  { id: "tshirt", name: "Tシャツ制作", month: 5, status: "completed", roles: ["kikaku"], description: "サークルTシャツ制作。", handoffNotes: "", handoffFiles: [] },
  { id: "shinsorenspring", name: "新早連春", month: 6, status: "active", roles: ["shokai", "preman"], description: "新早稲田連合春季大会。", handoffNotes: "", handoffFiles: [] },
  { id: "espaiospring", name: "エスパジオ春", month: 6, status: "active", roles: ["kikaku", "shokai", "kaikei"], description: "春季定期演奏会。", handoffNotes: "", handoffFiles: [] },
  { id: "summer", name: "夏合宿", month: 8, status: "planning", roles: ["kanjicho", "kaikei", "shokai", "kikaku"], description: "夏季強化合宿。", handoffNotes: "", handoffFiles: [] },
  { id: "espaifall", name: "エスパジオ秋", month: 10, status: "planning", roles: ["kikaku", "shokai", "kaikei"], description: "秋季定期演奏会。", handoffNotes: "", handoffFiles: [] },
  { id: "shinsorenfall", name: "新早連秋", month: 11, status: "planning", roles: ["shokai", "preman"], description: "新早稲田連合秋季大会。", handoffNotes: "", handoffFiles: [] },
  { id: "ski", name: "スキースノボ合宿", month: 1, status: "planning", roles: ["kikaku", "kaikei"], description: "冬季合宿。", handoffNotes: "", handoffFiles: [] },
  { id: "springcamp", name: "春合宿", month: 3, status: "planning", roles: ["kanjicho", "kaikei"], description: "春季合宿。", handoffNotes: "", handoffFiles: [] },
];

const DEFAULT_DATASET: YearDataset = {
  roles: INITIAL_ROLES,
  projects: INITIAL_PROJECTS,
  tasks: [],
  minutes: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-11-16";

function getMonthEmoji(month: number) {
  const map: Record<number, string> = { 4: "🌸", 5: "👕", 6: "🎵", 7: "🌅", 8: "🏕️", 9: "🍃", 10: "🍂", 11: "🏆", 12: "❄️", 1: "⛷️", 2: "🌨️", 3: "🌱" };
  return map[month] ?? "📅";
}

function getDaysDiff(iso: string) {
  const today = new Date(TODAY);
  const target = new Date(iso);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_CFG: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  overdue: { label: "期限超過", bg: "bg-red-50", text: "text-red-700" },
  "in-progress": { label: "進行中", bg: "bg-blue-50", text: "text-blue-700" },
  todo: { label: "未着手", bg: "bg-slate-100", text: "text-slate-600" },
  completed: { label: "完了", bg: "bg-green-50", text: "text-green-700" },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: "高", color: "text-red-600" },
  medium: { label: "中", color: "text-amber-600" },
  low: { label: "低", color: "text-slate-400" },
};

const PROJECT_STATUS_CFG: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  completed: { label: "完了", bg: "bg-green-50", text: "text-green-700" },
  active: { label: "進行中", bg: "bg-blue-50", text: "text-blue-700" },
  planning: { label: "計画中", bg: "bg-amber-50", text: "text-amber-700" },
};

const FILE_BADGE_CFG: Record<HandoffFile["fileType"], string> = {
  "PDF": "bg-red-100 text-red-700",
  "Word": "bg-blue-100 text-blue-700",
  "Excel/Sheets": "bg-emerald-100 text-emerald-700",
  "その他": "bg-slate-200 text-slate-700",
};

const MONTHS_LABEL = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];
const MONTHS_NUM = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

// ─── File Attachment Component ───────────────────────────────────────────────

function HandoffFilesSection({
  files,
  onAddFile,
  onDeleteFile,
}: {
  files: HandoffFile[];
  onAddFile: (file: Omit<HandoffFile, "id">) => void;
  onDeleteFile: (id: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState<HandoffFile["fileType"]>("PDF");
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onAddFile({ title: title.trim(), fileType, url: url.trim() });
    setTitle("");
    setUrl("");
    setIsAdding(false);
  }

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Paperclip size={14} className="text-indigo-600" />
          <span>引き継ぎ資料ファイル（Word / PDF / ドライブ共有リンク）</span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> 資料リンクを追加
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">資料名</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 会計引き継ぎマニュアル.pdf"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">形式</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as HandoffFile["fileType"])}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="PDF">PDF</option>
                <option value="Word">Word (.docx)</option>
                <option value="Excel/Sheets">Excel / スプレッドシート</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">共有URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-slate-500 bg-slate-100 rounded-lg">キャンセル</button>
            <button type="submit" className="px-3 py-1 text-xs text-white bg-indigo-600 rounded-lg font-medium">登録</button>
          </div>
        </form>
      )}

      {files.length === 0 ? (
        <p className="text-xs text-slate-400">登録されている資料はありません。</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium text-slate-800 hover:text-indigo-600 truncate"
              >
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${FILE_BADGE_CFG[f.fileType]}`}>{f.fileType}</span>
                <span className="truncate">{f.title}</span>
                <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
              </a>
              <button type="button" onClick={() => onDeleteFile(f.id)} className="text-slate-300 hover:text-red-500 p-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  view, onNavigate, open, onClose, years, currentYear, onSelectYear, onCreateNewYear, syncStatus
}: {
  view: View; onNavigate: (v: View) => void; open: boolean; onClose: () => void;
  years: string[]; currentYear: string; onSelectYear: (y: string) => void; onCreateNewYear: () => void;
  syncStatus: "synced" | "saving" | "error";
}) {
  function isActive(id: View) {
    if (id === "roles") return view === "roles" || view === "role-detail";
    if (id === "projects") return view === "projects" || view === "project-detail";
    return view === id;
  }

  const navContent = (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.18em] mb-1">SUPABASE REALTIME</div>
            <h1 className="text-base font-semibold text-white leading-snug">サークル<br />データベース</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-white/50 hover:text-white mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] text-white/50 font-medium">表示中の年度</label>
          <select
            value={currentYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="w-full bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-lg px-2.5 py-2 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-slate-900 text-white">{y}年度</option>
            ))}
          </select>
          <button
            onClick={onCreateNewYear}
            className="w-full text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center justify-center gap-1 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <FolderPlus size={12} /> 新しい年度を作成
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {[
          { id: "dashboard", label: "ダッシュボード", Icon: Home },
          { id: "roles", label: "役職", Icon: Users },
          { id: "projects", label: "プロジェクト", Icon: FolderOpen },
          { id: "tasks", label: "タスク", Icon: CheckSquare },
          { id: "annual", label: "年間計画", Icon: Calendar },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { onNavigate(id as View); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${isActive(id as View) ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}

        <div className="my-2.5 border-t border-white/10" />

        {[
          { id: "minutes", label: "議事録", Icon: FileText },
          { id: "handoff", label: "引き継ぎ", Icon: BookOpen },
          { id: "templates", label: "テンプレート", Icon: Layout },
          { id: "faq", label: "FAQ", Icon: HelpCircle },
          { id: "search", label: "検索", Icon: Search },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { onNavigate(id as View); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${isActive(id as View) ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-white/10 flex items-center gap-2">
        {syncStatus === "saving" && <span className="text-xs text-amber-300 animate-pulse flex items-center gap-1">☁️ 保存中...</span>}
        {syncStatus === "synced" && <span className="text-xs text-green-400 flex items-center gap-1"><Cloud size={13} /> クラウド同期済み</span>}
        {syncStatus === "error" && <span className="text-xs text-red-400 flex items-center gap-1"><CloudOff size={13} /> 同期エラー</span>}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-56 bg-slate-900 flex-col flex-shrink-0 h-screen sticky top-0">{navContent}</aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-slate-900 flex flex-col h-full shadow-xl">{navContent}</aside>
        </div>
      )}
    </>
  );
}

// ─── Main App Component ──────────────────────────────────────────────────────

export default function App() {
  const [db, setDb] = useState<Record<string, YearDataset>>({});
  const [currentYear, setCurrentYear] = useState<string>("2026");
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data, error } = await supabase.from("circle_app_data").select("*");
      if (error || !data || data.length === 0) {
        const initialDb = { "2026": DEFAULT_DATASET };
        setDb(initialDb);
        await supabase.from("circle_app_data").upsert({ year: "2026", dataset: DEFAULT_DATASET });
      } else {
        const loaded: Record<string, YearDataset> = {};
        data.forEach((row: { year: string; dataset: YearDataset }) => {
          loaded[row.year] = row.dataset;
        });
        setDb(loaded);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const years = useMemo(() => Object.keys(db).sort((a, b) => Number(b) - Number(a)), [db]);
  const activeData = db[currentYear] || DEFAULT_DATASET;
  const { roles, projects, tasks, minutes } = activeData;

  async function updateCurrentYearData(updater: (prev: YearDataset) => YearDataset) {
    const updatedDataset = updater(activeData);
    setDb((prev) => ({
      ...prev,
      [currentYear]: updatedDataset,
    }));

    setSyncStatus("saving");
    const { error } = await supabase
      .from("circle_app_data")
      .upsert({ year: currentYear, dataset: updatedDataset, updated_at: new Date().toISOString() });

    if (error) {
      setSyncStatus("error");
    } else {
      setSyncStatus("synced");
    }
  }

  async function handleCreateNewYear() {
    const nextYearNum = years.length > 0 ? Math.max(...years.map(Number)) + 1 : 2026;
    const inputYear = window.prompt("新しい年度（西暦4桁）を入力：", String(nextYearNum));
    if (!inputYear || !/^\d{4}$/.test(inputYear.trim())) return;
    const yStr = inputYear.trim();

    if (db[yStr]) {
      setCurrentYear(yStr);
      return;
    }

    const newDataset: YearDataset = {
      roles: roles.map((r) => ({ ...r, members: ["未定", "未定"], handoffNotes: "", handoffManual: "", handoffFiles: [] })),
      projects: projects.map((p) => ({ ...p, status: "planning", handoffNotes: "", handoffFiles: [] })),
      tasks: [],
      minutes: [],
    };

    setDb((prev) => ({ ...prev, [yStr]: newDataset }));
    setCurrentYear(yStr);
    await supabase.from("circle_app_data").upsert({ year: yStr, dataset: newDataset });
  }

  function getRoleNames(roleIds: string[]) {
    if (!roleIds || roleIds.length === 0) return "—";
    return roleIds.map((id) => roles.find((r) => r.id === id)?.name ?? id).join("・");
  }

  function getProjectName(id: string | null) {
    if (!id) return "サークル共通";
    return projects.find((p) => p.id === id)?.name ?? id;
  }

  function formatMembers(members: string[]) {
    const valid = members.map((m) => m.trim()).filter(Boolean);
    return valid.length > 0 ? valid.join("・") : "担当者未設定";
  }

  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState<string>("");
  const [newTaskRoles, setNewTaskRoles] = useState<string[]>(["kanjicho"]);
  const [newTaskAssignee, setNewTaskAssignee] = useState("山田 太郎");
  const [newTaskDeadline, setNewTaskDeadline] = useState(TODAY);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function handleNavigate(v: View, id?: string) {
    setView(v);
    setSelectedId(id ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openTaskModalWithContext(opts?: { roleId?: string; projectId?: string }) {
    if (opts?.roleId) {
      setNewTaskRoles([opts.roleId]);
      const rObj = roles.find((r) => r.id === opts.roleId);
      if (rObj?.members[0]) setNewTaskAssignee(rObj.members[0]);
    }
    if (opts?.projectId) {
      setNewTaskProject(opts.projectId);
    }
    setIsModalOpen(true);
  }

  async function toggleTaskStatus(id: number) {
    await updateCurrentYearData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        let nextStatus: TaskStatus = "todo";
        if (t.status === "todo") nextStatus = "in-progress";
        else if (t.status === "in-progress" || t.status === "overdue") nextStatus = "completed";
        else if (t.status === "completed") nextStatus = "todo";
        return { ...t, status: nextStatus };
      }),
    }));
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || newTaskRoles.length === 0) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      project: newTaskProject || null,
      roles: newTaskRoles,
      assignee: newTaskAssignee.trim() || "未定",
      deadline: newTaskDeadline,
      priority: newTaskPriority,
      status: "todo",
    };

    await updateCurrentYearData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    setNewTaskTitle("");
    setIsModalOpen(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="animate-spin text-3xl">⏳</div>
          <div className="text-sm">Supabaseからデータを読み込んでいます...</div>
        </div>
      </div>
    );
  }

  // ─── Sub Views ─────────────────────────────────────────────────────────────

  function DashboardView() {
    const overdueTasks = tasks.filter((t) => t.status === "overdue" || (t.status !== "completed" && getDaysDiff(t.deadline) < 0));
    const activeTasks = tasks.filter((t) => t.status === "in-progress" || t.status === "todo");
    const activeProjects = projects.filter((p) => p.status === "active" || p.status === "planning");
    const urgentTasks = [...tasks].filter((t) => t.status !== "completed").sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 6);

    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg mb-2">
              <span>☁️ {currentYear}年度 Supabaseリアルタイム同期中</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">サークル運営ダッシュボード</h1>
          </div>
          <button
            onClick={() => openTaskModalWithContext()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> タスク追加
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
          {[
            { label: "要注意・超過", value: overdueTasks.length, sub: "件のタスク", valueClass: "text-red-600" },
            { label: "進行中・未着手", value: activeTasks.length, sub: "件", valueClass: "" },
            { label: "進行中・計画中PJ", value: activeProjects.length, sub: "件", valueClass: "text-blue-700" },
            { label: "議事録ストック", value: minutes.length, sub: "件", valueClass: "" },
          ].map(({ label, value, sub, valueClass }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="text-xs text-slate-500 mb-2">{label}</div>
              <div className={`text-3xl font-semibold ${valueClass}`}>{value}</div>
              <div className="text-xs text-slate-400 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-sm">期限の近いタスク</h2>
                <button onClick={() => handleNavigate("tasks")} className="text-xs text-indigo-600 hover:underline">全て見る</button>
              </div>
              <div className="divide-y divide-slate-100">
                {urgentTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">未完了タスクはありません</div>
                ) : urgentTasks.map((task) => {
                  const sc = STATUS_CFG[task.status];
                  const diff = getDaysDiff(task.deadline);
                  return (
                    <div key={task.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                      <button onClick={() => toggleTaskStatus(task.id)} className="text-slate-400 hover:text-indigo-600">
                        {task.status === "completed" ? <CheckCircle2 size={19} className="text-green-600" /> : <Circle size={19} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>{task.title}</div>
                        <div className="text-xs text-slate-400">{getRoleNames(task.roles)} · {getProjectName(task.project)} · {task.assignee}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-medium ${diff < 0 ? "text-red-600" : diff <= 3 ? "text-amber-600" : "text-slate-500"}`}>
                          {diff < 0 ? `${Math.abs(diff)}日超過` : diff === 0 ? "今日" : `${diff}日後`}
                        </div>
                        <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b border-slate-100"><h3 className="text-sm font-semibold">最近の議事録</h3></div>
              <div className="divide-y divide-slate-100">
                {minutes.slice(0, 3).map((m) => (
                  <div key={m.id} onClick={() => handleNavigate("minutes")} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                    <div className="text-xs font-medium text-slate-800">{m.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function TasksView() {
    const [filter, setFilter] = useState<TaskFilter>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const filteredTasks = useMemo(() => {
      return tasks.filter((t) => {
        if (roleFilter !== "all" && !t.roles.includes(roleFilter)) return false;
        if (filter === "completed") return t.status === "completed";
        if (filter === "overdue") return t.status === "overdue" || (t.status !== "completed" && getDaysDiff(t.deadline) < 0);
        if (filter === "today") return t.deadline === TODAY && t.status !== "completed";
        if (filter === "week") {
          const diff = getDaysDiff(t.deadline);
          return diff >= 0 && diff <= 7 && t.status !== "completed";
        }
        return t.status !== "completed";
      });
    }, [filter, roleFilter, tasks]);

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">タスク管理</h1>
            <p className="text-slate-500 text-sm">幹事全員でリアルタイム共有されます。</p>
          </div>
          <button onClick={() => openTaskModalWithContext()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> 新規タスク
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">タスクはありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const sc = STATUS_CFG[task.status];
                return (
                  <div key={task.id} className="px-5 py-4 flex items-center gap-3.5 hover:bg-slate-50">
                    <button onClick={() => toggleTaskStatus(task.id)} className="text-slate-400 hover:text-indigo-600">
                      {task.status === "completed" ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>{task.title}</div>
                      <div className="text-xs text-slate-400">{getRoleNames(task.roles)} · {getProjectName(task.project)} · 担当: {task.assignee}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function RoleDetailView({ roleId }: { roleId: string }) {
    const [tab, setTab] = useState<RoleTab>("overview");
    const role = roles.find((r) => r.id === roleId);
    if (!role) return <div className="p-8">役職が見つかりません</div>;

    const [isEditingMembers, setIsEditingMembers] = useState(false);
    const [member1, setMember1] = useState(role.members[0] || "");
    const [member2, setMember2] = useState(role.members[1] || "");

    const [isEditingOverview, setIsEditingOverview] = useState(false);
    const [editDesc, setEditDesc] = useState(role.description);
    const [editDuties, setEditDuties] = useState(role.duties.join("\n"));
    const [editFlow, setEditFlow] = useState(role.annualFlow.join("\n"));

    const [isAddingMinute, setIsAddingMinute] = useState(false);
    const [minTitle, setMinTitle] = useState("");
    const [minSummary, setMinSummary] = useState("");

    const [isEditingHandoff, setIsEditingHandoff] = useState(false);
    const [editNotes, setEditNotes] = useState(role.handoffNotes);
    const [editManual, setEditManual] = useState(role.handoffManual);

    useEffect(() => {
      setMember1(role.members[0] || "");
      setMember2(role.members[1] || "");
      setEditDesc(role.description);
      setEditDuties(role.duties.join("\n"));
      setEditFlow(role.annualFlow.join("\n"));
      setEditNotes(role.handoffNotes);
      setEditManual(role.handoffManual);
    }, [role]);

    async function saveMembers() {
      const updated = [member1.trim(), member2.trim()].filter(Boolean);
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => (r.id === role!.id ? { ...r, members: updated } : r)),
      }));
      setIsEditingMembers(false);
    }

    async function saveOverview() {
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) =>
          r.id === role!.id ? { ...r, description: editDesc.trim(), duties: editDuties.split("\n").filter(Boolean), annualFlow: editFlow.split("\n").filter(Boolean) } : r
        ),
      }));
      setIsEditingOverview(false);
    }

    async function handleAddMinute(e: React.FormEvent) {
      e.preventDefault();
      if (!minTitle.trim() || !minSummary.trim()) return;
      const newMin: Minute = { id: Date.now(), title: minTitle.trim(), date: TODAY, roles: [role!.id], project: null, summary: minSummary.trim() };
      await updateCurrentYearData((prev) => ({ ...prev, minutes: [newMin, ...prev.minutes] }));
      setMinTitle(""); setMinSummary(""); setIsAddingMinute(false);
    }

    async function saveHandoff() {
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => (r.id === role!.id ? { ...r, handoffNotes: editNotes, handoffManual: editManual } : r)),
      }));
      setIsEditingHandoff(false);
    }

    async function handleAddFile(file: Omit<HandoffFile, "id">) {
      const newFile = { ...file, id: String(Date.now()) };
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => (r.id === role!.id ? { ...r, handoffFiles: [...(r.handoffFiles || []), newFile] } : r)),
      }));
    }

    async function handleDeleteFile(fileId: string) {
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => (r.id === role!.id ? { ...r, handoffFiles: (r.handoffFiles || []).filter((f) => f.id !== fileId) } : r)),
      }));
    }

    const roleTasks = tasks.filter((t) => t.roles.includes(roleId));
    const relatedProjects = projects.filter((p) => p.roles.includes(roleId));
    const roleMinutes = minutes.filter((m) => m.roles.includes(roleId));

    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <button onClick={() => handleNavigate("roles")} className="flex items-center gap-1.5 text-sm text-slate-500 mb-6"><ArrowLeft size={14} /> 役職一覧に戻る</button>
        <div className="flex items-center gap-4 mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-5xl">{role.emoji}</span>
          <div>
            <h1 className="text-2xl font-semibold">{role.name}</h1>
            {!isEditingMembers ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-600 text-sm font-medium">担当: {formatMembers(role.members)}</span>
                <button onClick={() => setIsEditingMembers(true)} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1"><Edit3 size={11} /> 変更</button>
              </div>
            ) : (
              <div className="flex gap-2 mt-2">
                <input type="text" value={member1} onChange={(e) => setMember1(e.target.value)} className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-32" />
                <input type="text" value={member2} onChange={(e) => setMember2(e.target.value)} className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-32" />
                <button onClick={saveMembers} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg">保存</button>
                <button onClick={() => setIsEditingMembers(false)} className="text-slate-500 text-xs px-2">キャンセル</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(["overview", "tasks", "minutes", "handoff"] as RoleTab[]).map((tabId) => (
            <button key={tabId} onClick={() => setTab(tabId)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === tabId ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>
              {tabId === "overview" ? "概要" : tabId === "tasks" ? "タスク" : tabId === "minutes" ? "議事録" : "引き継ぎ・資料"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-semibold">仕事内容</h3><button onClick={() => setIsEditingOverview(true)} className="text-xs text-indigo-600"><Edit3 size={12} /> 編集</button></div>
            {!isEditingOverview ? (
              <p className="text-sm text-slate-600">{role.description}</p>
            ) : (
              <div className="space-y-3">
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border rounded-xl p-3 text-sm" />
                <div className="flex justify-end gap-2"><button onClick={() => setIsEditingOverview(false)} className="px-3 py-1 text-xs bg-slate-100 rounded">キャンセル</button><button onClick={saveOverview} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">保存</button></div>
              </div>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between"><span className="text-xs text-slate-500">関連タスク</span><button onClick={() => openTaskModalWithContext({ roleId: role.id })} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg">タスク追加</button></div>
            {roleTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b py-2 text-sm">
                <span>{t.title}</span>
                <span className="text-xs text-slate-400">担当: {t.assignee}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "minutes" && (
          <div className="space-y-4">
            {!isAddingMinute ? (
              <button onClick={() => setIsAddingMinute(true)} className="text-xs bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl">+ 議事録追加</button>
            ) : (
              <form onSubmit={handleAddMinute} className="bg-white border rounded-2xl p-5 space-y-3">
                <input type="text" value={minTitle} onChange={(e) => setMinTitle(e.target.value)} placeholder="会議タイトル" className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm" required />
                <textarea value={minSummary} onChange={(e) => setMinSummary(e.target.value)} placeholder="内容" rows={3} className="w-full bg-slate-50 border rounded-xl p-3 text-sm" required />
                <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAddingMinute(false)} className="text-xs px-3 py-1">キャンセル</button><button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">保存</button></div>
              </form>
            )}
            {roleMinutes.map((m) => (
              <div key={m.id} className="bg-white border rounded-2xl p-4"><div className="font-semibold text-sm">{m.title}</div><p className="text-xs text-slate-600 mt-1">{m.summary}</p></div>
            ))}
          </div>
        )}

        {tab === "handoff" && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <HandoffFilesSection files={role.handoffFiles || []} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} />
            {!isEditingHandoff ? (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 rounded-xl"><div className="text-xs font-semibold text-amber-900 mb-1">⚠️ 注意点</div><p className="text-xs text-amber-800">{role.handoffNotes || "未記入"}</p></div>
                <button onClick={() => setIsEditingHandoff(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl">テキスト編集</button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} className="w-full bg-amber-50/50 border rounded-xl p-3 text-sm" />
                <div className="flex justify-end gap-2"><button onClick={() => setIsEditingHandoff(false)} className="text-xs px-3 py-1">キャンセル</button><button onClick={saveHandoff} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">保存</button></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function ProjectDetailView({ projectId }: { projectId: string }) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return <div className="p-8">プロジェクトが見つかりません</div>;
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <button onClick={() => handleNavigate("projects")} className="flex items-center gap-1.5 text-sm text-slate-500 mb-6"><ArrowLeft size={14} /> プロジェクト一覧に戻る</button>
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-slate-600">{project.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      <Sidebar
        view={view} onNavigate={handleNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        years={years} currentYear={currentYear} onSelectYear={setCurrentYear} onCreateNewYear={handleCreateNewYear}
        syncStatus={syncStatus}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600"><Menu size={20} /></button>
          <span className="font-semibold text-sm">サークルDB ({currentYear})</span>
        </header>

        <main className="flex-1 pb-16">
          {view === "dashboard" && <DashboardView />}
          {view === "tasks" && <TasksView />}
          {view === "roles" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold mb-4">役職一覧 ({currentYear}年度)</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((r) => (
                  <button key={r.id} onClick={() => handleNavigate("role-detail", r.id)} className="bg-white border rounded-2xl p-5 text-left hover:border-indigo-300 transition-all">
                    <div className="text-3xl mb-2">{r.emoji}</div>
                    <div className="font-semibold text-base">{r.name}</div>
                    <div className="text-xs text-indigo-600 mt-1">担当: {formatMembers(r.members)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {view === "projects" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold mb-4">プロジェクト一覧</h1>
              <div className="space-y-3">
                {projects.map((p) => (
                  <button key={p.id} onClick={() => handleNavigate("project-detail", p.id)} className="w-full bg-white border rounded-2xl p-5 text-left flex items-center gap-4 hover:border-indigo-300">
                    <span className="text-3xl">{getMonthEmoji(p.month)}</span>
                    <div><div className="font-semibold">{p.name}</div><div className="text-xs text-slate-500">{p.description}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {view === "role-detail" && selectedId && <RoleDetailView roleId={selectedId} />}
          {view === "project-detail" && selectedId && <ProjectDetailView projectId={selectedId} />}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-base mb-4">新規タスク追加</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="タスク名" className="w-full border rounded-xl px-3.5 py-2.5 text-sm" required autoFocus />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">キャンセル</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl">追加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}