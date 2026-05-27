export type TaskCategory = 'work' | 'personal';
export type TaskPriority = 'high' | 'normal' | 'system';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  completed: boolean;
  estimatedEnergy?: string;
  dueDateText?: string;
}

export interface Alarm {
  id: string;
  time: string;
  title: string;
  active: boolean;
}

export interface SysLog {
  id: string;
  text: string;
  time: string;
  type: 'primary' | 'secondary';
}

export interface ActiveObjective {
  title: string;
  description: string;
  critical: boolean;
}
