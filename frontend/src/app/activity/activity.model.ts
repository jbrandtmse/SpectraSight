export interface BaseActivity {
  id: number;
  type: 'statusChange' | 'assignmentChange' | 'codeReferenceChange' | 'comment';
  actorName: string;
  actorType: 'human' | 'agent';
  timestamp: string;
}

export interface StatusChangeActivity extends BaseActivity {
  type: 'statusChange';
  fromStatus: string;
  toStatus: string;
}

export interface AssignmentChangeActivity extends BaseActivity {
  type: 'assignmentChange';
  fromAssignee: string;
  toAssignee: string;
}

export interface CodeReferenceChangeActivity extends BaseActivity {
  type: 'codeReferenceChange';
  className: string;
  methodName?: string;
  action: 'added' | 'removed';
}

export interface CommentActivity extends BaseActivity {
  type: 'comment';
  body: string;
}

export type Activity = StatusChangeActivity | AssignmentChangeActivity | CodeReferenceChangeActivity | CommentActivity;
