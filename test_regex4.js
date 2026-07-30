const text = `# Australia sues Telegram over alleged failures to remove terror content[Latest News](/category/latest-news)PublishedJul 30, 2026Telegram faces Australian court proceedings`;
const regex = /\[[^\]]+\]\([^)]+\)Published\s?[a-zA-Z]{3,10}\s?\d{1,2},\s?\d{4}/g;
console.log("MATCH:", text.match(regex));
let cleaned = text.replace(regex, '\n\n');
console.log(JSON.stringify(cleaned));
