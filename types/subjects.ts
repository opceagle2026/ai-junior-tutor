export const SUBJECT_DOMAINS = [
    "語文領域",
    "數學領域",
    "社會領域",
    "自然科學領域",
  ] as const;
  
  export type SubjectDomain = (typeof SUBJECT_DOMAINS)[number];
  
  export const SUPPORTED_SUBJECTS = [
    "國語文",
    "英語文",
    "數學",
    "歷史",
    "地理",
    "公民與社會",
    "生物",
    "理化",
    "地球科學",
  ] as const;
  
  export type SupportedSubject = (typeof SUPPORTED_SUBJECTS)[number];
  
  export const SUBJECT_DOMAIN_MAP: Record<SupportedSubject, SubjectDomain> = {
    國語文: "語文領域",
    英語文: "語文領域",
    數學: "數學領域",
    歷史: "社會領域",
    地理: "社會領域",
    公民與社會: "社會領域",
    生物: "自然科學領域",
    理化: "自然科學領域",
    地球科學: "自然科學領域",
  };
  
  export const SUBJECT_UNITS: Record<SupportedSubject, string[]> = {
    國語文: [
      "閱讀理解",
      "作文",
      "文學賞析",
      "字音字形",
      "成語修辭",
      "文言文",
    ],
    英語文: [
      "文法",
      "單字",
      "閱讀理解",
      "克漏字",
      "會考英聽",
      "寫作",
    ],
    數學: [
      "數與量",
      "代數",
      "函數",
      "幾何",
      "統計與機率",
      "圖形推理",
      "邏輯計算",
      "非選題型",
    ],
    歷史: ["臺灣史", "中國史", "世界史"],
    地理: [
      "臺灣地理",
      "中國地理",
      "世界地理",
      "地形氣候",
      "人口產業",
      "區域地理",
    ],
    公民與社會: [
      "法律",
      "政治",
      "經濟",
      "社會規範",
      "人權",
      "家庭與校園生活",
    ],
    生物: [
      "細胞",
      "生殖",
      "遺傳",
      "演化",
      "生態",
      "人體生理",
    ],
    理化: [
      "物理",
      "化學",
      "力與運動",
      "電與磁",
      "熱",
      "聲光",
      "物質變化",
      "酸鹼鹽",
    ],
    地球科學: [
      "天文",
      "地質",
      "板塊",
      "天氣與氣候",
      "海洋",
      "天然災害",
    ],
  };
  
  export function isSupportedSubject(value: unknown): value is SupportedSubject {
    return (
      typeof value === "string" &&
      SUPPORTED_SUBJECTS.includes(value as SupportedSubject)
    );
  }
  
  export function getSubjectDomain(subject: SupportedSubject): SubjectDomain {
    return SUBJECT_DOMAIN_MAP[subject];
  }