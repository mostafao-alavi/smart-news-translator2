const regex1 = /\[[^\]]+\]\([^)]+\)Published\s?[a-zA-Z]{3,10}\s?\d{1,2},\s?\d{4}/g;
const regex2 = /_?\*?\*?Related:\*?\*?_?\s*\[.*?\]\(.*?\)/gi;

const str = "# Australia sues Telegram over alleged failures to remove terror content[Latest News](/category/latest-news)PublishedJul 30, 2026Telegram faces";
console.log("TEST 1 match:", str.match(regex1));
const str2 = "_**Related:**_ [_**Pavel Durov says Telegram to roll out native Gram crypto wallet**_](https://cointelegraph.com/news/telegram-launch-native-self-custody-gram-wallet-for-over-1-billion-users-durov)The regulator is seeking financial penalties";
console.log("TEST 2 match:", str2.match(regex2));
