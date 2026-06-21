export function executeComplaintFlow({ action, args }) {
  switch (action) {
    case 'report':
      return {
        action: 'report_complaint',
        requiresConfirmation: true,
        severity: args.priority || 'medium',
        preview: `Melaporkan keluhan: ${args.issue?.slice(0, 100)}`,
      };
    case 'escalate':
      return { action: 'handover_to_human', requiresConfirmation: false, reason: 'complaint_escalation' };
    default:
      return { success: false, error: `unknown_action: ${action}` };
  }
}
