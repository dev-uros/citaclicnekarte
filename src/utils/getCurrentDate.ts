export function getCurrentDate() {
    // Create a new Date object
    const today = new Date();

// Get the day, month, and year from the Date object
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = today.getFullYear();

// Format the date as 'dd.mm.yyyy'
    return `${day}.${month}.${year}`;
}
