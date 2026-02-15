export type TicketType = 'bug' | 'task' | 'story' | 'epic';
export type TicketStatus = 'Open' | 'In Progress' | 'Blocked' | 'Complete';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TicketRef {
  id: string;
  title: string;
  type: TicketType;
}

export interface TicketChild {
  id: string;
  title: string;
  status: TicketStatus;
  type: TicketType;
}

export interface Ticket {
  id: string;
  type: TicketType;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: string;
  parentId?: string;
  parent?: TicketRef;
  children?: TicketChild[];
  createdAt: string;
  updatedAt: string;
}

export interface BugTicket extends Ticket {
  type: 'bug';
  severity?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface TaskTicket extends Ticket {
  type: 'task';
  estimatedHours?: number;
  actualHours?: number;
}

export interface StoryTicket extends Ticket {
  type: 'story';
  storyPoints?: number;
  acceptanceCriteria?: string;
}

export interface EpicTicket extends Ticket {
  type: 'epic';
  startDate?: string;
  targetDate?: string;
}

export interface FilterState {
  type?: string[];
  status?: string[];
  priority?: string;
  assignee?: string;
  search?: string;
  sort?: string;
}

export interface CreateTicketRequest {
  type: TicketType;
  title: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  parentId?: string;
}
