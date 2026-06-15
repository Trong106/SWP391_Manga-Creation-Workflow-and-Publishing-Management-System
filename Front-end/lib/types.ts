export type UserRole = "mangaka" | "assistant" | "tantou" | "editorial"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
}

export interface Series {
  id: string
  title: string
  coverImage: string
  status: "proposal" | "active" | "hiatus" | "completed" | "cancelled"
  mangakaId: string
  tantouId?: string
  genre: string[]
  ranking?: number
  totalChapters: number
  lastUpdated: string
}

export interface Chapter {
  id: string
  seriesId: string
  number: number
  title: string
  status: "draft" | "in_progress" | "review" | "approved" | "published"
  dueDate: string
  pages: Page[]
}

export interface Page {
  id: string
  chapterId: string
  pageNumber: number
  imageUrl?: string
  status: "pending" | "assigned" | "in_progress" | "submitted" | "approved"
  regions: Region[]
  assignedTo?: string
}

export interface Region {
  id: string
  pageId: string
  type: "line_art" | "background" | "effects" | "text" | "coloring"
  coordinates: { x: number; y: number; width: number; height: number }
  assignedTo?: string
  status: "pending" | "in_progress" | "completed"
}

export interface Task {
  id: string
  title: string
  description?: string
  type: "line_art" | "background" | "effects" | "coloring" | "lettering" | "review"
  pageId: string
  regionId?: string
  assigneeId?: string
  assignerId: string
  status: "pending" | "in_progress" | "submitted" | "revision" | "approved"
  dueDate: string
  payment: number
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "task_assigned" | "task_submitted" | "review_needed" | "payment" | "deadline" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export interface PayrollRecord {
  id: string
  assistantId: string
  taskId: string
  amount: number
  status: "pending" | "paid"
  paidAt?: string
  createdAt: string
}

export interface PublishSchedule {
  id: string
  chapterId: string
  scheduledDate: string
  status: "scheduled" | "published" | "cancelled"
}

export interface ReaderVote {
  id: string
  seriesId: string
  weekNumber: number
  year: number
  votes: number
  rank: number
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details: Record<string, unknown>
  createdAt: string
}
