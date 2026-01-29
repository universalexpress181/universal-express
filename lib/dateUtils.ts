// lib/dateUtils.ts

export const calculateEstimatedDate = (serviceType: string): string => {
  const today = new Date();
  let daysToAdd = 0;

  // 1. Define Rules based on Service Type
  // You can match these strings to your database 'package_type' or add a new dropdown for Service Speed
  if (serviceType.toLowerCase().includes("express") || serviceType.toLowerCase().includes("premium")) {
    daysToAdd = 2; // Express: 2-3 days
  } else {
    daysToAdd = 5; // Standard: 5-7 days
  }

  // 2. Add Business Days Logic (Skip Sundays)
  let count = 0;
  while (count < daysToAdd) {
    today.setDate(today.getDate() + 1);
    // If it's not Sunday (0), increment count
    if (today.getDay() !== 0) {
      count++;
    }
  }

  // 3. Format Date (e.g., "Tue, 14 Oct")
  return today.toLocaleDateString('en-IN', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
};