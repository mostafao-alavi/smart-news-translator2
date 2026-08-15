import { translateTextWithAI, generateSeoMetadataWithAI } from '../src/cron/translator';
import { mockD1 } from '../src/db/local_d1';
import dotenv from 'dotenv';
dotenv.config();

const env: any = {
  DB: mockD1,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
};

const testArticles = [
  {
    domain: 'تکنولوژی (Tech - TechCrunch / The Verge)',
    source: 'TechCrunch',
    original_title: 'Serverless Edge Inference Accelerates Next-Gen Multimodal AI Models',
    original_text: `Modern cloud architectures are rapidly shifting towards serverless edge computing to minimize latency overhead in generative AI applications. By deploying quantized multimodal weights directly onto distributed edge clusters, developers can achieve sub-50 millisecond token generation without maintaining dedicated cold-start infrastructure. Industry leaders emphasize that dynamic workload orchestration and memory-efficient runtime compilers are critical for scaling high-throughput neural inference pipelines across global endpoints.`
  },
  {
    domain: 'کریپتو و وب۳ (Crypto - Cointelegraph / CoinDesk)',
    source: 'CoinDesk',
    original_title: 'Liquid Staking Protocols Surge as Ethereum Liquidity Pools Pivot to Proof-of-Stake Yields',
    original_text: `Decentralized finance (DeFi) ecosystems are witnessing a massive resurgence in total value locked (TVL) as liquid staking derivatives capture institutional capital. Following protocol upgrades on the Proof-of-Stake consensus layer, automated market makers (AMMs) are rebalancing liquidity pools to maximize yield farming incentives while mitigating impermanent loss. On-chain analytics indicate that smart contract escrow volume for liquid-staked tokens has reached unprecedented quarterly highs.`
  },
  {
    domain: 'اقتصاد و فایننس (Finance - Bloomberg / Financial Times)',
    source: 'Bloomberg',
    original_title: 'Hedge Funds Recalibrate Portfolios Amid Quantitative Tightening and Shifting Cash Flow Yields',
    original_text: `Global macro hedge funds are adjusting their arbitrage positions as central banks sustain quantitative tightening measures to tame core inflation. Fixed-income strategists point out that widening credit spreads and volatile benchmark bond yields are forcing institutional asset managers to prioritize defensive dividend cash flows over speculative equity growth. Private equity sponsors are simultaneously restructuring leveraged debt obligations ahead of upcoming corporate refinancing deadlines.`
  }
];

async function runTests() {
  console.log('Running AI 2-Stage Translation and SEO Quality Tests...');
  const results = [];

  for (const item of testArticles) {
    console.log(`\nTesting domain: ${item.domain}`);
    const [titleRes, textRes] = await Promise.all([
      translateTextWithAI(env, item.original_title, 'english', 'persian', 'gemini-3.7-flash'),
      translateTextWithAI(env, item.original_text, 'english', 'persian', 'gemini-3.7-flash'),
    ]);

    const finalTitle = titleRes.translatedText;
    const finalText = textRes.translatedText;

    const seoRes = await generateSeoMetadataWithAI(env, finalTitle, finalText, 'gemini-3.7-flash');

    results.push({
      ...item,
      translated_title: finalTitle,
      translated_text: finalText,
      seo: seoRes
    });
  }

  console.log('\n--- Test Results Summary ---');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(console.error);
