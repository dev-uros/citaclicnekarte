export function formatDateString(dateString: string) {

    // Extract day, month, and year from the input string
    const day = dateString.slice(0, 2);
    const month = dateString.slice(2, 4);
    const year = dateString.slice(4, 8);

    // Return formatted date string
    return `${day}.${month}.${year}`;
}