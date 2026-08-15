import dotenv from 'dotenv';
import { testBot, sendNewsToTelegram } from '../src/cron/telegramBot';
dotenv.config();

async function runTelegramTest() {
  console.log('--- Telegram Bot Integration Test ---');
  console.log('Bot Token in env:', process.env.TELEGRAM_BOT_TOKEN ? 'EXISTS' : 'NOT SET');

  // Test 1: testBot
  console.log('\n[1] Running testBot()...');
  const pingResult = await testBot(process.env.TELEGRAM_BOT_TOKEN, '@updaaate_crypto');
  console.log('testBot result:', JSON.stringify(pingResult, null, 2));

  // Test 2: sendNewsToTelegram with WordPress post ID 6
  console.log('\n[2] Running sendNewsToTelegram() with Sample Post #6...');
  const newsResult = await sendNewsToTelegram({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: '@updaaate_crypto',
    title: 'آینده متعلق به برندهایی است که بتوانند بیزنس و سرگرمی را باهم ترکیب کنند',
    content: 'به گزارش دی‌ام برد، یکی از موضوعات مهم مطرح‌شده در Cannes Lions امسال، تغییر نقش پلتفرم‌های بزرگ بود. این پلتفرم‌ها دیگر فقط محلی برای نمایش تبلیغات نیستند، بلکه به سمت ساخت اکوسیستم‌هایی حرکت می‌کنند که در آن محتوا، خرید، سرگرمی و تعامل با مخاطب در کنار یکدیگر قرار می‌گیرد.',
    tags: ['تبلیغات', 'برند', 'سرگرمی', 'آمازون'],
    sourceUrl: 'https://www.updaaate.ir/2026/07/30/%d8%a2%db%8c%d9%86%d8%af%d9%87-%d9%85%d8%aa%d8%b9%d9%84%d9%82-%d8%a8%d9%87-%d8%a8%d8%b1%d9%86%d8%af%d9%87%d8%a7%db%8c%db%8c-%d8%a7%d8%b3%d8%aa-%da%a9%d9%87-%d8%a8%d8%aa%d9%88%d8%a7%d9%86%d9%86%d8%af/'
  });
  console.log('sendNewsToTelegram result:', JSON.stringify(newsResult, null, 2));
}

runTelegramTest().catch(console.error);
