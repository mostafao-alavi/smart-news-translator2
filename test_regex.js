const regex = /_?\*?\*?Related:\*?\*?_?\s*\[.*?\]\(.*?\)/gi;
console.log("_**Related:**_ [_**Pavel Durov says Telegram to roll out native Gram crypto wallet**_](https://cointelegraph.com)".replace(regex, ''));
console.log("**Related:** [**Some link**](https://example.com)".replace(regex, ''));
console.log("Related: [some link](https://test.com)".replace(regex, ''));
