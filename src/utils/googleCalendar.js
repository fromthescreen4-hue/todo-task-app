/**
 * Google Calendar Direct Event Integration
 * Builds pre-filled Google Calendar event template URLs and opens them in a new tab.
 */
export function addToGoogleCalendar(task) {
  if (!task || !task.title) return;

  const title = encodeURIComponent(task.title);
  const details = encodeURIComponent(
    (task.description || '') +
    (task.category ? `\nCategory: ${task.category}` : '') +
    (task.priority ? `\nPriority: ${task.priority.toUpperCase()}` : '') +
    `\nCreated via TaskPulse App`
  );

  // Default date handling
  const dueDateStr = task.dueDate || new Date().toISOString().slice(0, 10);
  const dueTimeStr = task.dueTime || '09:00';

  // Format YYYYMMDDTHHmm00
  const cleanDate = dueDateStr.replace(/-/g, '');
  const cleanTime = dueTimeStr.replace(/:/g, '') + '00';
  
  const startISO = `${cleanDate}T${cleanTime}`;

  // End time 1 hour later
  let hours = parseInt(dueTimeStr.split(':')[0], 10);
  let minutes = dueTimeStr.split(':')[1] || '00';
  hours = (hours + 1) % 24;
  const endCleanTime = `${String(hours).padStart(2, '0')}${minutes}00`;
  const endISO = `${cleanDate}T${endCleanTime}`;

  const dates = `${startISO}/${endISO}`;

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

  // Open Google Calendar in new tab
  window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
}
