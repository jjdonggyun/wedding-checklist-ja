export type Language = "ko" | "ja";

export type LocalizedText = {
  ko: string;
  ja: string;
};

export type ChecklistCategoryKey = string;

export type BudgetCategory = "package" | "required" | "optional" | "discount";

export type ScheduleType = "photo" | "ceremony" | "payment" | "deadline" | "consulting";

export type CoupleProfile = {
  groomName: LocalizedText;
  brideName: LocalizedText;
  weddingDateTime: string;
  weddingVenue: LocalizedText;
  photoDateTime: string;
  photoPrepDateTime: string;
  photoPrepEndDateTime: string;
  photoVendor: LocalizedText;
};

export type ChecklistCategory = {
  id: ChecklistCategoryKey;
  title: LocalizedText;
  description: LocalizedText;
};

export type ChecklistItem = {
  id: string;
  categoryId: ChecklistCategoryKey;
  title: LocalizedText;
  description?: LocalizedText;
  recommendedTiming: LocalizedText;
  deadline?: string;
  dueDate?: string;
  completed?: boolean;
  important?: boolean;
  undecided?: boolean;
  caution?: boolean;
  memo?: string;
  vendor?: LocalizedText;
  links?: string[];
  defaultMemo?: LocalizedText;
};

export type ChecklistItemState = {
  completed: boolean;
  memo: string;
  deadline?: string;
  links: string[];
  important?: boolean;
  costId?: string;
};

export type BudgetItem = {
  id: string;
  category: BudgetCategory;
  title: LocalizedText;
  amount?: number;
  amountLabel?: LocalizedText;
  dueDate?: string;
  paymentDueDate?: string;
  paid?: boolean;
  required?: boolean;
  memo?: string;
  note?: LocalizedText;
};

export type ScheduleItem = {
  id: string;
  type: ScheduleType;
  title: LocalizedText;
  startsAt: string;
  endsAt?: string;
  relatedChecklistId?: string;
  location?: LocalizedText;
  note?: LocalizedText;
};

export type WeddingTemplate = {
  version: number;
  categories: ChecklistCategory[];
  checklist: ChecklistItem[];
  budget: BudgetItem[];
  schedule: ScheduleItem[];
};

export type WeddingUserState = {
  checklist: Record<string, ChecklistItemState>;
  budget: Record<string, { paid: boolean; selected: boolean; actualAmount?: number }>;
  notes: Record<string, string>;
};

export type WeddingData = {
  profile: CoupleProfile;
  language: Language;
  template: WeddingTemplate;
  userState: WeddingUserState;
  updatedAt: string;
};
