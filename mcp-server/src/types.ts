/** Validates ticket IDs match the SS-{number} format (e.g., SS-42) */
export const TICKET_ID_PATTERN = /^SS-\d+$/;

export type TicketType = "bug" | "task" | "story" | "epic";
export type TicketStatus = "Open" | "In Progress" | "Blocked" | "Complete";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export interface Ticket {
  id: string;
  title: string;
  type: TicketType;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
