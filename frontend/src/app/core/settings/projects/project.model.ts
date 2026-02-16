export interface Project {
  id: number;
  name: string;
  prefix: string;
  owner: string;
  sequenceCounter: number;
  ticketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  prefix: string;
  owner?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  owner?: string;
}
