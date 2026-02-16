/** Validates ticket IDs match the {PREFIX}-{number} format (e.g., SS-42, DATA-1) */
export const TICKET_ID_PATTERN = /^[A-Z]{2,10}-\d+$/;

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
