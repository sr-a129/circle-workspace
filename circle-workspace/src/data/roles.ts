import { Role } from "@/types";

export const roles: Role[] = [
  {
    id: "leader",
    name: "幹事長",
    description: "サークル全体の運営・管理",

    overview: "サークル全体の運営を統括し、各役職をまとめます。",

    tasks: [
      "幹部会の進行",
      "年間方針の決定",
      "役職との連携"
    ],

    schedule: [
      "4月：新歓",
      "8月：夏合宿",
      "12月：忘年会"
    ],

    documents: [
      "幹事長マニュアル.pdf"
    ]
  },

  {
    id: "assistant",
    name: "幹事補佐",
    description: "幹事長のサポート",

    overview: "幹事長のサポートを行い、必要に応じて代理も務めます。",

    tasks: [
      "議事録作成",
      "連絡事項の共有",
      "イベント補助"
    ],

    schedule: [
      "通年：幹部会",
      "イベント前：準備"
    ],

    documents: [
      "幹事補佐マニュアル.pdf"
    ]
  },

  {
    id: "accounting",
    name: "会計",
    description: "予算・会計管理",

    overview: "サークル全体のお金を管理する役職です。",

    tasks: [
      "部費の回収",
      "合宿費の集金",
      "会計報告書の作成"
    ],

    schedule: [
      "4月：部費回収",
      "8月：夏合宿会計",
      "12月：忘年会会計"
    ],

    documents: [
      "引継ぎ資料.pdf",
      "予算表.xlsx"
    ]
  },

  {
    id: "planning",
    name: "企画",
    description: "イベントの企画・運営",

    overview: "イベントの企画・運営を担当します。",

    tasks: [
      "企画立案",
      "会場予約",
      "タイムテーブル作成"
    ],

    schedule: [
      "4月：新歓",
      "6月：新歓旅行",
      "9月：夏合宿"
    ],

    documents: [
      "企画マニュアル.pdf"
    ]
  },

  {
    id: "premane",
    name: "プレマネ",
    description: "練習や備品管理",

    overview: "練習運営や備品の管理を担当します。",

    tasks: [
      "コート予約",
      "備品確認",
      "ボール管理"
    ],

    schedule: [
      "毎週：練習運営"
    ],

    documents: [
      "プレマネマニュアル.pdf"
    ]
  },

  {
    id: "public",
    name: "渉外",
    description: "他団体との連絡",

    overview: "他団体との連絡や大会運営を担当します。",

    tasks: [
      "大会申請",
      "対外連絡",
      "他サークルとの調整"
    ],

    schedule: [
      "大会前：申請",
      "交流会：連絡"
    ],

    documents: [
      "渉外マニュアル.pdf"
    ]
  }
];