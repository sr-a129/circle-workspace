import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Home, Users, FolderOpen, CheckSquare, Calendar,
  FileText, BookOpen, Layout, HelpCircle, Search,
  ArrowLeft, X, Menu, Plus, CheckCircle2, Circle, Edit3,
  ExternalLink, Paperclip, Trash2, FolderPlus, Cloud, CloudOff,
  Clock, MessageSquare
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

interface AttachedFile {
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
  handoffFiles: AttachedFile[];
}

interface Task {
  id: number;
  title: string;
  description?: string;
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
  impressions?: string;
  handoffFiles: AttachedFile[];
}

interface Minute {
  id: number;
  title: string;
  date: string;
  roles: string[];
  project: string | null;
  summary: string;
  files?: AttachedFile[];
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
  { id: "shinkan", name: "新歓", month: 4, status: "completed", roles: ["kanjicho", "kikaku", "preman"], description: "新入生歓迎イベント。体験練習や説明会の運営。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "tshirt", name: "Tシャツ制作", month: 5, status: "completed", roles: ["kikaku"], description: "サークルオリジナルTシャツのデザイン・サイズ集計・発注。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "shinsorenspring", name: "新早連春", month: 6, status: "active", roles: ["shokai", "preman"], description: "新早稲田連合春季大会のエントリーと選手調整。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "espaiospring", name: "エスパジオ春", month: 6, status: "active", roles: ["kikaku", "shokai", "kaikei"], description: "春季定期演奏会の企画・会場手配・予算管理。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "summer", name: "夏合宿", month: 8, status: "planning", roles: ["kanjicho", "kaikei", "shokai", "kikaku"], description: "夏季強化合宿の宿手配・プログラム企画・会計精算。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "espaifall", name: "エスパジオ秋", month: 10, status: "planning", roles: ["kikaku", "shokai", "kaikei"], description: "秋季定期演奏会の企画運営。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "shinsorenfall", name: "新早連秋", month: 11, status: "planning", roles: ["shokai", "preman"], description: "新早稲田連合秋季大会の運営・参加。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "ski", name: "スキースノボ合宿", month: 1, status: "planning", roles: ["kikaku", "kaikei"], description: "冬季の親睦合宿・ツアー手配。", handoffNotes: "", impressions: "", handoffFiles: [] },
  { id: "springcamp", name: "春合宿", month: 3, status: "planning", roles: ["kanjicho", "kaikei"], description: "年度末の春季合宿および世代交代イベント。", handoffNotes: "", impressions: "", handoffFiles: [] },
];

const DEFAULT_DATASET: YearDataset = {
  roles: INITIAL_ROLES,
  projects: INITIAL_PROJECTS,
  tasks: [],
  minutes: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthEmoji(month: number) {
  const map: Record<number, string> = { 4: "🌸", 5: "👕", 6: "🎵", 7: "🌅", 8: "🏕️", 9: "🍃", 10: "🍂", 11: "🏆", 12: "❄️", 1: "⛷️", 2: "🌨️", 3: "🌱" };
  return map[month] ?? "📅";
}

function getDaysDiff(iso: string) {
  if (!iso) return 999;
  const today = new Date(getTodayISO());
  const target = new Date(iso);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_CFG: Record<TaskStatus, { label: string; bg: string; text: string; border: string }> = {
  todo: { label: "未着手", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  "in-progress": { label: "進行中", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
  completed: { label: "完了", bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  overdue: { label: "期限超過", bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: "高", color: "text-red-600" },
  medium: { label: "中", color: "text-amber-600" },
  low: { label: "低", color: "text-slate-400" },
};

const PROJECT_STATUS_CFG: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  planning: { label: "計画中", bg: "bg-amber-50", text: "text-amber-700" },
  active: { label: "進行中", bg: "bg-blue-50", text: "text-blue-700" },
  completed: { label: "完了", bg: "bg-green-50", text: "text-green-700" },
};

const FILE_BADGE_CFG: Record<AttachedFile["fileType"], string> = {
  "PDF": "bg-red-100 text-red-700",
  "Word": "bg-blue-100 text-blue-700",
  "Excel/Sheets": "bg-emerald-100 text-emerald-700",
  "その他": "bg-slate-200 text-slate-700",
};

const MONTHS_NUM = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

// ─── Reusable File Attachment Component ──────────────────────────────────────

function FilesAttachmentSection({
  title = "関連ファイル・共有リンク（Word / PDF / Googleドライブ）",
  files,
  onAddFile,
  onDeleteFile,
  compact = false,
}: {
  title?: string;
  files: AttachedFile[];
  onAddFile: (file: Omit<AttachedFile, "id">) => void;
  onDeleteFile: (id: string) => void;
  compact?: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [fileTitle, setFileTitle] = useState("");
  const [fileType, setFileType] = useState<AttachedFile["fileType"]>("PDF");
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileTitle.trim() || !url.trim()) return;
    onAddFile({ title: fileTitle.trim(), fileType, url: url.trim() });
    setFileTitle("");
    setUrl("");
    setIsAdding(false);
  }

  return (
    <div className={`${compact ? "p-3 bg-slate-50/80" : "p-4 bg-slate-50"} border border-slate-200 rounded-xl space-y-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Paperclip size={13} className="text-indigo-600 flex-shrink-0" />
          <span>{title}</span>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <Plus size={12} /> ファイル追加
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">ファイル名</label>
              <input
                type="text"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="例: 会議資料.pdf / 企画書.docx"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">種類</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as AttachedFile["fileType"])}
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
            <label className="block text-[11px] text-slate-500 mb-1">共有URL（Googleドライブ・OneDrive・Boxなど）</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
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
        <p className="text-[11px] text-slate-400">添付ファイルはありません。</p>
      ) : (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5">
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
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.18em] mb-1">CIRCLE DATABASE</div>
            <h1 className="text-base font-semibold text-white leading-snug">サークル運営<br />データベース</h1>
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
          { id: "projects", label: "プロジェクト（行事）", Icon: FolderOpen },
          { id: "tasks", label: "タスク管理", Icon: CheckSquare },
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
          { id: "minutes", label: "議事録一覧", Icon: FileText },
          { id: "handoff", label: "引き継ぎ一覧", Icon: BookOpen },
          { id: "search", label: "全体検索", Icon: Search },
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
        {syncStatus === "synced" && <span className="text-xs text-green-400 flex items-center gap-1"><Cloud size={13} /> 同期済み</span>}
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
      projects: projects.map((p) => ({ ...p, status: "planning", handoffNotes: "", impressions: "", handoffFiles: [] })),
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

  // ─── Task Modal States ─────────────────────────────────────────────────────
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskProject, setNewTaskProject] = useState<string>("");
  const [newTaskRoles, setNewTaskRoles] = useState<string[]>(["kanjicho"]);
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState(getTodayISO());
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");

  // ─── Project Modal States ──────────────────────────────────────────────────
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjMonth, setNewProjMonth] = useState<number>(6);
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjRoles, setNewProjRoles] = useState<string[]>(["kanjicho"]);

  const [searchQuery, setSearchQuery] = useState("");

  function handleNavigate(v: View, id?: string) {
    setView(v);
    setSelectedId(id ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openTaskModalWithContext(opts?: { roleId?: string; projectId?: string }) {
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskDeadline(getTodayISO());
    setNewTaskPriority("medium");

    if (opts?.projectId) {
      setNewTaskProject(opts.projectId);
      const pObj = projects.find((p) => p.id === opts.projectId);
      if (pObj && pObj.roles.length > 0) {
        setNewTaskRoles(pObj.roles);
      }
    } else {
      setNewTaskProject("");
    }

    if (opts?.roleId) {
      setNewTaskRoles([opts.roleId]);
      const rObj = roles.find((r) => r.id === opts.roleId);
      if (rObj?.members[0]) setNewTaskAssignee(rObj.members[0]);
    } else if (!opts?.projectId) {
      setNewTaskRoles(["kanjicho"]);
      setNewTaskAssignee("");
    }
    setIsTaskModalOpen(true);
  }

  function toggleRoleSelection(roleId: string, currentList: string[], setter: (v: string[]) => void) {
    if (currentList.includes(roleId)) {
      setter(currentList.filter((id) => id !== roleId));
    } else {
      setter([...currentList, roleId]);
    }
  }

  async function changeTaskStatus(id: number, nextStatus: TaskStatus) {
    await updateCurrentYearData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
    }));
  }

  async function deleteTask(id: number) {
    if (!window.confirm("このタスクを削除しますか？")) return;
    await updateCurrentYearData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      project: newTaskProject || null,
      roles: newTaskRoles.length > 0 ? newTaskRoles : ["kanjicho"],
      assignee: newTaskAssignee.trim() || "未定",
      deadline: newTaskDeadline,
      priority: newTaskPriority,
      status: "todo",
    };

    await updateCurrentYearData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    setIsTaskModalOpen(false);
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: newProjName.trim(),
      month: newProjMonth,
      status: "planning",
      roles: newProjRoles,
      description: newProjDesc.trim(),
      handoffNotes: "",
      impressions: "",
      handoffFiles: [],
    };

    await updateCurrentYearData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));

    setNewProjName("");
    setNewProjDesc("");
    setIsProjectModalOpen(false);
    handleNavigate("project-detail", newProj.id);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="animate-spin text-3xl">⏳</div>
          <div className="text-sm">データベースを読み込んでいます...</div>
        </div>
      </div>
    );
  }

  // ─── Reusable Task Card Component ──────────────────────────────────────────

  function TaskItemCard({ task }: { task: Task }) {
    const sc = STATUS_CFG[task.status];
    const diff = getDaysDiff(task.deadline);

    return (
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => changeTaskStatus(task.id, task.status === "completed" ? "todo" : "completed")}
            className="text-slate-400 hover:text-indigo-600 mt-0.5 flex-shrink-0"
            title="完了/未着手を切り替え"
          >
            {task.status === "completed" ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 行事ラベル */}
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                📅 {getProjectName(task.project)}
              </span>
              {/* 関係幹部ラベル */}
              {task.roles.map((rId) => {
                const rObj = roles.find((r) => r.id === rId);
                return (
                  <span key={rId} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {rObj ? `${rObj.emoji} ${rObj.name}` : rId}
                  </span>
                );
              })}
            </div>

            <div className={`text-sm font-semibold ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
              {task.title}
            </div>

            {task.description && (
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-100/70 rounded-lg px-2.5 py-1.5">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span>担当: <strong className="font-medium text-slate-700">{task.assignee}</strong></span>
              <span className={`flex items-center gap-1 font-medium ${diff < 0 && task.status !== "completed" ? "text-red-600" : diff <= 3 && task.status !== "completed" ? "text-amber-600" : ""}`}>
                <Clock size={12} /> 期限: {task.deadline} ({diff < 0 ? `${Math.abs(diff)}日超過` : diff === 0 ? "今日" : `あと${diff}日`})
              </span>
            </div>
          </div>
        </div>

        {/* ステータス直接切り替えドロップダウン＆削除 */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <select
            value={task.status}
            onChange={(e) => changeTaskStatus(task.id, e.target.value as TaskStatus)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${sc.bg} ${sc.text} ${sc.border}`}
          >
            <option value="todo">未着手</option>
            <option value="in-progress">進行中</option>
            <option value="completed">完了</option>
            <option value="overdue">期限超過</option>
          </select>
          <button
            onClick={() => deleteTask(task.id)}
            className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="タスクを削除"
          >
            <Trash2 size={14} />
          </button>
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
              <span>☁️ {currentYear}年度 リアルタイム同期中</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">サークル運営ダッシュボード</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm"
            >
              <FolderPlus size={16} className="text-indigo-600" /> 行事追加
            </button>
            <button
              onClick={() => openTaskModalWithContext()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> タスク追加
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
          {[
            { label: "要注意・超過", value: overdueTasks.length, sub: "件のタスク", valueClass: "text-red-600" },
            { label: "進行中・未着手", value: activeTasks.length, sub: "件", valueClass: "" },
            { label: "進行中・計画中行事", value: activeProjects.length, sub: "件", valueClass: "text-blue-700" },
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
                <h2 className="font-semibold text-sm">期限の近いタスク（ステータス変更可能）</h2>
                <button onClick={() => handleNavigate("tasks")} className="text-xs text-indigo-600 hover:underline">全て見る</button>
              </div>
              <div className="divide-y divide-slate-100">
                {urgentTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">未完了タスクはありません</div>
                ) : urgentTasks.map((task) => (
                  <TaskItemCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold">進行中のプロジェクト</h3>
                <button onClick={() => handleNavigate("projects")} className="text-xs text-indigo-600 hover:underline">一覧</button>
              </div>
              <div className="divide-y divide-slate-100">
                {activeProjects.slice(0, 4).map((p) => (
                  <div key={p.id} onClick={() => handleNavigate("project-detail", p.id)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{getMonthEmoji(p.month)}</span>
                      <span className="text-xs font-medium text-slate-800 truncate">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{p.month}月</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold">最近の議事録</h3>
                <button onClick={() => handleNavigate("minutes")} className="text-xs text-indigo-600 hover:underline">一覧</button>
              </div>
              <div className="divide-y divide-slate-100">
                {minutes.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400">議事録はまだありません</div>
                ) : minutes.slice(0, 3).map((m) => (
                  <div key={m.id} onClick={() => handleNavigate("minutes")} className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                    <div className="text-xs font-medium text-slate-800">{m.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.date} · {getProjectName(m.project)}</div>
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
    const [projFilter, setProjFilter] = useState<string>("all");

    const filteredTasks = useMemo(() => {
      return tasks.filter((t) => {
        if (roleFilter !== "all" && !t.roles.includes(roleFilter)) return false;
        if (projFilter !== "all" && (t.project || "common") !== projFilter) return false;
        if (filter === "completed") return t.status === "completed";
        if (filter === "overdue") return t.status === "overdue" || (t.status !== "completed" && getDaysDiff(t.deadline) < 0);
        if (filter === "today") return t.deadline === getTodayISO() && t.status !== "completed";
        if (filter === "week") {
          const diff = getDaysDiff(t.deadline);
          return diff >= 0 && diff <= 7 && t.status !== "completed";
        }
        return true;
      });
    }, [filter, roleFilter, projFilter, tasks]);

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold">タスク管理</h1>
            <p className="text-slate-500 text-sm">右側のステータス欄から「未着手・進行中・完了」をいつでも切り替えられます。</p>
          </div>
          <button onClick={() => openTaskModalWithContext()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm">
            <Plus size={16} /> 新規タスク追加
          </button>
        </div>

        {/* 絞り込みフィルターバー */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-5 flex flex-wrap items-center gap-2.5 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: "すべて" },
              { id: "today", label: "今日期限" },
              { id: "week", label: "今週中" },
              { id: "overdue", label: "期限超過" },
              { id: "completed", label: "完了済み" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as TaskFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <select
              value={projFilter}
              onChange={(e) => setProjFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="all">すべての行事</option>
              <option value="common">サークル共通</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value="all">すべての役職</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">該当するタスクはありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <TaskItemCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Project Detail View (大幅に機能拡張) ─────────────────────────────────

  function ProjectDetailView({ projectId }: { projectId: string }) {
    const project = projects.find((p) => p.id === projectId);
    const [tab, setTab] = useState<ProjTab>("overview");

    // プロジェクト基本情報の編集状態
    const [isEditingProj, setIsEditingProj] = useState(false);
    const [editName, setEditName] = useState("");
    const [editMonth, setEditMonth] = useState<number>(4);
    const [editStatus, setEditStatus] = useState<ProjectStatus>("planning");
    const [editDesc, setEditDesc] = useState("");
    const [editRoles, setEditRoles] = useState<string[]>([]);

    // 議事録追加状態（プロジェクト専用）
    const [isAddingMin, setIsAddingMin] = useState(false);
    const [minTitle, setMinTitle] = useState("");
    const [minDate, setMinDate] = useState(getTodayISO());
    const [minSummary, setMinSummary] = useState("");
    const [minFiles, setMinFiles] = useState<AttachedFile[]>([]);

    // 引き継ぎ・感想の編集状態
    const [isEditingHandoff, setIsEditingHandoff] = useState(false);
    const [editNotes, setEditNotes] = useState("");
    const [editImpressions, setEditImpressions] = useState("");

    useEffect(() => {
      if (project) {
        setEditName(project.name);
        setEditMonth(project.month);
        setEditStatus(project.status);
        setEditDesc(project.description);
        setEditRoles(project.roles || []);
        setEditNotes(project.handoffNotes || "");
        setEditImpressions(project.impressions || "");
      }
    }, [project]);

    if (!project) return <div className="p-8">プロジェクトが見つかりません</div>;

    const involvedRoles = roles.filter((r) => project.roles.includes(r.id));
    const projectTasks = tasks.filter((t) => t.project === project.id);
    const projectMinutes = minutes.filter((m) => m.project === project.id);
    const sc = PROJECT_STATUS_CFG[project.status];

    async function handleSaveProjectInfo() {
      if (!editName.trim()) return;
      await updateCurrentYearData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project!.id
            ? { ...p, name: editName.trim(), month: editMonth, status: editStatus, description: editDesc.trim(), roles: editRoles }
            : p
        ),
      }));
      setIsEditingProj(false);
    }

    async function handleDeleteProject() {
      if (!window.confirm(`「${project!.name}」を削除してもよろしいですか？`)) return;
      await updateCurrentYearData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== project!.id),
      }));
      handleNavigate("projects");
    }

    async function handleAddProjectMinute(e: React.FormEvent) {
      e.preventDefault();
      if (!minTitle.trim() || !minSummary.trim()) return;
      const newMin: Minute = {
        id: Date.now(),
        title: minTitle.trim(),
        date: minDate,
        roles: project!.roles,
        project: project!.id,
        summary: minSummary.trim(),
        files: minFiles,
      };
      await updateCurrentYearData((prev) => ({
        ...prev,
        minutes: [newMin, ...prev.minutes],
      }));
      setMinTitle("");
      setMinSummary("");
      setMinFiles([]);
      setIsAddingMin(false);
    }

    async function handleSaveHandoffAndImpressions() {
      await updateCurrentYearData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project!.id ? { ...p, handoffNotes: editNotes, impressions: editImpressions } : p
        ),
      }));
      setIsEditingHandoff(false);
    }

    async function handleAddProjFile(file: Omit<AttachedFile, "id">) {
      const newFile = { ...file, id: String(Date.now()) };
      await updateCurrentYearData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project!.id ? { ...p, handoffFiles: [...(p.handoffFiles || []), newFile] } : p
        ),
      }));
    }

    async function handleDeleteProjFile(fileId: string) {
      await updateCurrentYearData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project!.id ? { ...p, handoffFiles: (p.handoffFiles || []).filter((f) => f.id !== fileId) } : p
        ),
      }));
    }

    async function handleAttachFileToExistingMinute(minuteId: number, file: Omit<AttachedFile, "id">) {
      const newFile = { ...file, id: String(Date.now()) };
      await updateCurrentYearData((prev) => ({
        ...prev,
        minutes: prev.minutes.map((m) =>
          m.id === minuteId ? { ...m, files: [...(m.files || []), newFile] } : m
        ),
      }));
    }

    async function handleRemoveFileFromExistingMinute(minuteId: number, fileId: string) {
      await updateCurrentYearData((prev) => ({
        ...prev,
        minutes: prev.minutes.map((m) =>
          m.id === minuteId ? { ...m, files: (m.files || []).filter((f) => f.id !== fileId) } : m
        ),
      }));
    }

    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => handleNavigate("projects")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft size={14} /> プロジェクト一覧に戻る
          </button>
          <button onClick={handleDeleteProject} className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1">
            <Trash2 size={13} /> この行事を削除
          </button>
        </div>

        {/* ヘッダー＆タイトル・詳細編集エリア */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          {!isEditingProj ? (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{getMonthEmoji(project.month)}</span>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">{project.month}月開催</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{project.description || "詳細説明はまだ入力されていません。"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProj(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start flex-shrink-0"
              >
                <Edit3 size={13} /> タイトル・詳細・関係幹部を編集
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">プロジェクト名（タイトル）</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">開催月</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    {MONTHS_NUM.map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">進行状況</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="planning">計画中</option>
                    <option value="active">進行中</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">プロジェクト詳細・概要</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="イベントの目的、場所、全体スケジュールなどの詳細を入力"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">関係する幹部（役職）を選択</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const checked = editRoles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoleSelection(r.id, editRoles, setEditRoles)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${checked ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        {r.emoji} {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsEditingProj(false)} className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl">キャンセル</button>
                <button onClick={handleSaveProjectInfo} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl">変更を保存</button>
              </div>
            </div>
          )}
        </div>

        {/* タブ切り替え */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
          {[
            { id: "overview", label: "関係幹部・主な仕事" },
            { id: "tasks", label: `タスク (${projectTasks.length})` },
            { id: "minutes", label: `議事録・会議資料 (${projectMinutes.length})` },
            { id: "handoff", label: "引き継ぎ資料・感想" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as ProjTab)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: 関係幹部と各幹部の主な仕事 */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">関係幹部とそれぞれの主な仕事</h2>
              <button onClick={() => setIsEditingProj(true)} className="text-xs text-indigo-600 hover:underline">
                + 関係幹部を変更する
              </button>
            </div>

            {involvedRoles.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
                関係幹部が設定されていません。上の「タイトル・詳細・関係幹部を編集」から選択してください。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {involvedRoles.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{r.emoji}</span>
                          <div>
                            <div className="font-bold text-sm text-slate-900">{r.name}</div>
                            <div className="text-xs text-indigo-600 font-medium">担当: {formatMembers(r.members)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => openTaskModalWithContext({ projectId: project.id, roleId: r.id })}
                          className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-medium"
                        >
                          + タスク依頼
                        </button>
                      </div>

                      <div className="text-xs font-semibold text-slate-500 mb-1.5">この役職の主な仕事・役割：</div>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                        {r.duties.map((duty, idx) => (
                          <li key={idx}>{duty}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: プロジェクトのタスク一覧＆作成 */}
        {tab === "tasks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">「{project.name}」に紐づくタスク一覧です。ここから新規タスクも作成できます。</p>
              <button
                onClick={() => openTaskModalWithContext({ projectId: project.id })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> この行事のタスクを追加
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {projectTasks.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">この行事のタスクはまだありません</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projectTasks.map((t) => (
                    <TaskItemCard key={t.id} task={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 議事録＆ファイル添付 */}
        {tab === "minutes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">会議の議事録やレジュメ・資料ファイルを残せます。</p>
              {!isAddingMin && (
                <button
                  onClick={() => setIsAddingMin(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus size={14} /> 議事録を作成
                </button>
              )}
            </div>

            {isAddingMin && (
              <form onSubmit={handleAddProjectMinute} className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                <h3 className="text-sm font-bold text-slate-800">新しい議事録を作成（{project.name}）</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">会議タイトル</label>
                    <input
                      type="text"
                      value={minTitle}
                      onChange={(e) => setMinTitle(e.target.value)}
                      placeholder="例: 第1回 実行委員会ミーティング"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">開催日</label>
                    <input
                      type="date"
                      value={minDate}
                      onChange={(e) => setMinDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">議事録内容・決定事項</label>
                  <textarea
                    value={minSummary}
                    onChange={(e) => setMinSummary(e.target.value)}
                    rows={4}
                    placeholder="話し合った内容、決まったこと、次回の宿題などを記入"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                    required
                  />
                </div>

                <FilesAttachmentSection
                  title="この議事録に資料ファイルを添付"
                  files={minFiles}
                  onAddFile={(f) => setMinFiles((prev) => [...prev, { ...f, id: String(Date.now()) }])}
                  onDeleteFile={(id) => setMinFiles((prev) => prev.filter((item) => item.id !== id))}
                  compact
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingMin(false)} className="px-4 py-2 text-xs bg-slate-100 rounded-xl">キャンセル</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-xl">議事録を保存</button>
                </div>
              </form>
            )}

            {projectMinutes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">
                この行事の議事録はまだありません
              </div>
            ) : (
              <div className="space-y-3">
                {projectMinutes.map((m) => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400">{m.date}</span>
                        <h4 className="font-bold text-base text-slate-900">{m.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{m.summary}</p>
                    <FilesAttachmentSection
                      title="添付された議事録・レジュメファイル"
                      files={m.files || []}
                      onAddFile={(f) => handleAttachFileToExistingMinute(m.id, f)}
                      onDeleteFile={(fid) => handleRemoveFileFromExistingMinute(m.id, fid)}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 引き継ぎ資料・感想・ファイル添付 */}
        {tab === "handoff" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <FilesAttachmentSection
              title="引き継ぎ資料ファイル（マニュアルPDF・会計シート・企画書Wordなど）"
              files={project.handoffFiles || []}
              onAddFile={handleAddProjFile}
              onDeleteFile={handleDeleteProjFile}
            />

            {!isEditingHandoff ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-xl">
                  <div className="text-xs font-bold text-amber-900 mb-1.5">⚠️ 来年度への引き継ぎ事項・注意点</div>
                  <p className="text-sm text-amber-900/90 whitespace-pre-wrap leading-relaxed">
                    {project.handoffNotes || "まだ記入されていません。「引き継ぎ・感想を編集」から来年度の後輩へのアドバイスを残しましょう。"}
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-xl">
                  <div className="text-xs font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={14} /> 運営を終えての感想・振り返り
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {project.impressions || "まだ感想は記入されていません。良かった点や反省点などを自由に記録できます。"}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingHandoff(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit3 size={13} /> 引き継ぎ・感想を編集する
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">⚠️ 来年度への引き継ぎ事項・注意点</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="予約のタイミング、業者とのやり取りで気をつけることなど"
                    className="w-full bg-amber-50/40 border border-amber-300 rounded-xl p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">💬 運営を終えての感想・振り返り</label>
                  <textarea
                    value={editImpressions}
                    onChange={(e) => setEditImpressions(e.target.value)}
                    rows={4}
                    placeholder="当日の雰囲気、参加者の反応、やってよかった工夫など"
                    className="w-full bg-indigo-50/40 border border-indigo-300 rounded-xl p-3 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingHandoff(false)} className="px-4 py-2 text-xs bg-slate-100 rounded-xl">キャンセル</button>
                  <button onClick={handleSaveHandoffAndImpressions} className="px-4 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-xl">保存する</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Role Detail View ──────────────────────────────────────────────────────

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

    const [isEditingHandoff, setIsEditingHandoff] = useState(false);
    const [editNotes, setEditNotes] = useState(role.handoffNotes);

    useEffect(() => {
      setMember1(role.members[0] || "");
      setMember2(role.members[1] || "");
      setEditDesc(role.description);
      setEditDuties(role.duties.join("\n"));
      setEditNotes(role.handoffNotes);
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
          r.id === role!.id ? { ...r, description: editDesc.trim(), duties: editDuties.split("\n").filter(Boolean) } : r
        ),
      }));
      setIsEditingOverview(false);
    }

    async function saveHandoff() {
      await updateCurrentYearData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => (r.id === role!.id ? { ...r, handoffNotes: editNotes } : r)),
      }));
      setIsEditingHandoff(false);
    }

    async function handleAddFile(file: Omit<AttachedFile, "id">) {
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
              <div className="flex flex-wrap gap-2 mt-2">
                <input type="text" value={member1} onChange={(e) => setMember1(e.target.value)} placeholder="担当者1" className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-32" />
                <input type="text" value={member2} onChange={(e) => setMember2(e.target.value)} placeholder="担当者2" className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-32" />
                <button onClick={saveMembers} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg">保存</button>
                <button onClick={() => setIsEditingMembers(false)} className="text-slate-500 text-xs px-2">キャンセル</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(["overview", "tasks", "handoff"] as RoleTab[]).map((tabId) => (
            <button key={tabId} onClick={() => setTab(tabId)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === tabId ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>
              {tabId === "overview" ? "仕事内容" : tabId === "tasks" ? `タスク (${roleTasks.length})` : "引き継ぎ・資料"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-bold">役職の概要・主な仕事</h3><button onClick={() => setIsEditingOverview(true)} className="text-xs text-indigo-600 flex items-center gap-1"><Edit3 size={12} /> 編集</button></div>
            {!isEditingOverview ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{role.description}</p>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">主な仕事リスト（プロジェクト画面にも自動表示されます）：</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
                    {role.duties.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">概要説明</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full bg-slate-50 border rounded-xl p-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">主な仕事（1行に1つずつ記入）</label>
                  <textarea value={editDuties} onChange={(e) => setEditDuties(e.target.value)} rows={5} className="w-full bg-slate-50 border rounded-xl p-3 text-sm" />
                </div>
                <div className="flex justify-end gap-2"><button onClick={() => setIsEditingOverview(false)} className="px-3 py-1 text-xs bg-slate-100 rounded">キャンセル</button><button onClick={saveOverview} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">保存</button></div>
              </div>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="text-xs text-slate-500">{role.name}が関わるタスク</span>
              <button onClick={() => openTaskModalWithContext({ roleId: role.id })} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg">+ タスク追加</button>
            </div>
            <div className="divide-y divide-slate-100">
              {roleTasks.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">タスクはありません</div> : roleTasks.map((t) => <TaskItemCard key={t.id} task={t} />)}
            </div>
          </div>
        )}

        {tab === "handoff" && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
            <FilesAttachmentSection files={role.handoffFiles || []} onAddFile={handleAddFile} onDeleteFile={handleDeleteFile} />
            {!isEditingHandoff ? (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 rounded-xl"><div className="text-xs font-semibold text-amber-900 mb-1">⚠️ 役職引き継ぎメモ</div><p className="text-xs text-amber-800 whitespace-pre-wrap">{role.handoffNotes || "未記入"}</p></div>
                <button onClick={() => setIsEditingHandoff(true)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl">メモ編集</button>
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
          <span className="font-semibold text-sm">サークルDB ({currentYear}年度)</span>
        </header>

        <main className="flex-1 pb-16">
          {view === "dashboard" && <DashboardView />}
          {view === "tasks" && <TasksView />}

          {view === "roles" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold mb-4">役職一覧 ({currentYear}年度)</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((r) => (
                  <button key={r.id} onClick={() => handleNavigate("role-detail", r.id)} className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-indigo-300 transition-all shadow-sm">
                    <div className="text-3xl mb-2">{r.emoji}</div>
                    <div className="font-bold text-base">{r.name}</div>
                    <div className="text-xs text-indigo-600 font-medium mt-1">担当: {formatMembers(r.members)}</div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "projects" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <div>
                  <h1 className="text-2xl font-semibold">プロジェクト（行事）一覧</h1>
                  <p className="text-slate-500 text-sm">行事ごとの関係幹部・タスク・議事録・引き継ぎ資料をまとめて管理できます。</p>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={16} /> プロジェクトを追加
                </button>
              </div>

              <div className="space-y-3">
                {projects.map((p) => {
                  const sc = PROJECT_STATUS_CFG[p.status];
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleNavigate("project-detail", p.id)}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{getMonthEmoji(p.month)}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-500">{p.month}月</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                          </div>
                          <div className="font-bold text-base text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-indigo-600 font-medium flex-shrink-0">
                        関係: {getRoleNames(p.roles)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "annual" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold mb-4">年間計画 ({currentYear}年度)</h1>
              <div className="space-y-3">
                {MONTHS_NUM.map((m) => {
                  const monthProjs = projects.filter((p) => p.month === m);
                  return (
                    <div key={m} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                      <div className="w-14 text-center font-bold text-indigo-600 text-sm">{m}月</div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {monthProjs.length === 0 ? (
                          <span className="text-xs text-slate-400">予定なし</span>
                        ) : (
                          monthProjs.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleNavigate("project-detail", p.id)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                            >
                              <span>{getMonthEmoji(p.month)}</span> {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "minutes" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
              <h1 className="text-2xl font-semibold">議事録一覧</h1>
              <p className="text-xs text-slate-500">各プロジェクトページの「議事録・会議資料」タブから新しい議事録やファイルを登録できます。</p>
              {minutes.length === 0 ? (
                <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">議事録はまだありません</div>
              ) : (
                minutes.map((m) => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{m.date}</span>
                      <span>·</span>
                      <span className="text-indigo-600 font-medium">{getProjectName(m.project)}</span>
                    </div>
                    <div className="font-bold text-base">{m.title}</div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.summary}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {view === "handoff" && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
              <h1 className="text-2xl font-semibold">引き継ぎ・感想一覧</h1>
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} onClick={() => handleNavigate("project-detail", p.id)} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-indigo-300">
                    <div className="font-bold text-sm mb-2">{getMonthEmoji(p.month)} {p.name}</div>
                    <div className="text-xs text-slate-600">引き継ぎ: {p.handoffNotes || "未記入"}</div>
                    <div className="text-xs text-indigo-700 mt-1">感想: {p.impressions || "未記入"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "search" && (
            <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
              <h1 className="text-2xl font-semibold">全体検索</h1>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タスク名、行事名、議事録キーワードを入力..."
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm shadow-sm"
              />
              {searchQuery.trim() && (
                <div className="space-y-3">
                  {tasks.filter((t) => t.title.includes(searchQuery) || (t.description || "").includes(searchQuery)).map((t) => (
                    <div key={t.id} className="bg-white border rounded-2xl overflow-hidden"><TaskItemCard task={t} /></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "role-detail" && selectedId && <RoleDetailView roleId={selectedId} />}
          {view === "project-detail" && selectedId && <ProjectDetailView projectId={selectedId} />}
        </main>
      </div>

      {/* ─── 新規タスク追加モーダル（行事ラベル・幹部ラベル・タイトル・詳細・期限） ─── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">新規タスクを追加</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">タスクのタイトル *</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="例: 会場の仮予約を完了させる"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">タスクの詳細・内容メモ</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="具体的な手順、連絡先、注意点などの詳細を入力"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">📅 行事（プロジェクト）ラベル</label>
                  <select
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">サークル共通（行事指定なし）</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.month}月：{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">⏰ いつまでの期限か *</label>
                  <input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">👥 関係幹部ラベル（複数選択可）</label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => {
                    const selected = newTaskRoles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoleSelection(r.id, newTaskRoles, setNewTaskRoles)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        {r.emoji} {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">担当者名（任意）</label>
                <input
                  type="text"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="例: 山田 太郎（未入力なら「未定」）"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">キャンセル</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">タスクを追加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 新規プロジェクト追加モーダル ────────────────────────────────────── */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">新しいプロジェクト（行事）を追加</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">行事名（タイトル） *</label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="例: 学園祭出店 / 追いコン"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">開催月</label>
                  <select
                    value={newProjMonth}
                    onChange={(e) => setNewProjMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    {MONTHS_NUM.map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">プロジェクト詳細・内容</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  placeholder="どんなイベントか、概要を入力してください"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">関係幹部（担当する役職）</label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => {
                    const selected = newProjRoles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoleSelection(r.id, newProjRoles, setNewProjRoles)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        {r.emoji} {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">キャンセル</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">追加して開く</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}