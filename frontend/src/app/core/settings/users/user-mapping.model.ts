export interface UserMapping {
  id: number;
  irisUsername: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  irisUsername: string;
  displayName: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  isActive?: boolean;
}
