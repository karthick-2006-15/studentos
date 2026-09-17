import { ITask } from '../models/Task';

export interface PriorityCalculationResult {
  score: number;
  reason: string;
}

export function calculateTaskPriorityScore(
  task: Partial<ITask>,
  additionalContext?: { academicWeight?: number; isAssessmentSoon?: boolean }
): PriorityCalculationResult {
  let score = 30; // base score
  const reasons: string[] = [];

  // 1. User specified priority
  switch (task.priority) {
    case 'urgent':
      score += 35;
      reasons.push('Marked Urgent');
      break;
    case 'high':
      score += 25;
      reasons.push('High Priority');
      break;
    case 'medium':
      score += 15;
      break;
    case 'low':
      score += 5;
      break;
  }

  // 2. Deadline proximity
  if (task.dueDate) {
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const hoursRemaining = (due - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      score += 45;
      reasons.push('Overdue');
    } else if (hoursRemaining <= 24) {
      score += 40;
      reasons.push('Due within 24h');
    } else if (hoursRemaining <= 72) {
      score += 25;
      reasons.push('Due within 3 days');
    } else if (hoursRemaining <= 168) {
      score += 10;
      reasons.push('Due this week');
    }
  }

  // 3. Task Type & Academic Importance
  switch (task.type) {
    case 'assessment':
      score += 30;
      reasons.push('Exam Assessment');
      break;
    case 'assignment':
      score += 20;
      reasons.push('Course Assignment');
      break;
    case 'study':
      score += 15;
      break;
    case 'coding':
      score += 15;
      break;
    case 'habit':
      score += 10;
      break;
  }

  // 4. Academic Weight if available
  if (additionalContext?.academicWeight && additionalContext.academicWeight > 0) {
    score += Math.min(20, Math.round(additionalContext.academicWeight * 0.6));
    reasons.push(`Weight ${additionalContext.academicWeight}%`);
  }

  // 5. Effort optimization: Quick wins (<30m) get slight boost for momentum
  if (task.estimatedMinutes && task.estimatedMinutes <= 30 && task.estimatedMinutes > 0) {
    score += 5;
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  const reason = reasons.length > 0 ? reasons.slice(0, 2).join(' · ') : 'Regular Scheduled Item';

  return {
    score: normalizedScore,
    reason
  };
}
