import type { Importance } from '../types';

export function priorityClass(importance: Importance): string {
  switch (importance) {
    case 'high':
      return 'pill-high';
    case 'medium':
      return 'pill-medium';
    default:
      return 'pill-low';
  }
}

export function importanceLabel(importance: Importance): string {
  switch (importance) {
    case 'high':
      return 'High priority';
    case 'medium':
      return 'Medium priority';
    default:
      return 'Low priority';
  }
}