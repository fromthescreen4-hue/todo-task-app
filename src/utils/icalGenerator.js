/**
 * Generates an iCalendar (.ics) format file string for a list of tasks
 * Allows importing into Google Calendar, Apple Calendar, Outlook, etc.
 */
export function exportTasksToICal(tasks, calendarName = 'TaskPulse Tasks') {
  if (!tasks || tasks.length === 0) return;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskPulse//Task Management App//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const formatDate = (dateStr, timeStr = '09:00') => {
    if (!dateStr) return null;
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = (timeStr || '0900').replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  tasks.forEach(task => {
    if (!task.dueDate) return;

    const dtStart = formatDate(task.dueDate, task.dueTime || '09:00');
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:taskpulse-${task.id}@app`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`SUMMARY:${escapeICalText(task.title)}`);
    if (task.description) {
      lines.push(`DESCRIPTION:${escapeICalText(task.description)}`);
    }
    if (task.priority) {
      lines.push(`PRIORITY:${task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9'}`);
    }
    if (task.category) {
      lines.push(`CATEGORIES:${escapeICalText(task.category)}`);
    }
    lines.push(`STATUS:${task.completed ? 'COMPLETED' : 'NEEDS-ACTION'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const icsContent = lines.join('\r\n');

  // Trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TaskPulse_Export_${new Date().toISOString().slice(0,10)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeICalText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
