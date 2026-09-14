import { addDays, format, setHours, setMinutes, nextDay } from 'date-fns';

const DAY_MAP = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

/**
 * Natural language date/time parser
 * Converts input like "Buy milk tomorrow at 5pm" -> title: "Buy milk", date: "YYYY-MM-DD", time: "17:00"
 */
export function parseNaturalLanguageTask(input) {
  if (!input || typeof input !== 'string') {
    return { cleanTitle: '', dueDate: '', dueTime: '', detected: false };
  }

  let text = input.trim();
  let targetDate = new Date();
  let timeStr = '09:00';
  let dateDetected = false;
  let timeDetected = false;

  // 1. Time parsing (e.g., "5pm", "17:00", "at 10:30 am", "at 8pm")
  const timeRegex = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      timeDetected = true;
      text = text.replace(timeMatch[0], '');
    }
  }

  // 2. Relative date keywords
  const lowerText = text.toLowerCase();

  if (/\btoday\b/.test(lowerText)) {
    dateDetected = true;
    text = text.replace(/\btoday\b/i, '');
  } else if (/\btomorrow\b/.test(lowerText)) {
    targetDate = addDays(new Date(), 1);
    dateDetected = true;
    text = text.replace(/\btomorrow\b/i, '');
  } else {
    // Check "next [weekday]" or "[weekday]"
    const dayRegex = /\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;
    const dayMatch = text.match(dayRegex);

    if (dayMatch) {
      const dayName = dayMatch[1].toLowerCase();
      const targetDayIndex = DAY_MAP[dayName];
      if (targetDayIndex !== undefined) {
        targetDate = nextDay(new Date(), targetDayIndex);
        dateDetected = true;
        text = text.replace(dayMatch[0], '');
      }
    }
  }

  // Clean up title text
  const cleanTitle = text.replace(/\s+/g, ' ').replace(/\b(at|on|by|for)\b\s*$/i, '').trim();
  const dueDateStr = dateDetected ? format(targetDate, 'yyyy-MM-dd') : '';

  return {
    cleanTitle: cleanTitle || input,
    dueDate: dueDateStr,
    dueTime: timeDetected ? timeStr : (dueDateStr ? '09:00' : ''),
    detected: dateDetected || timeDetected
  };
}
