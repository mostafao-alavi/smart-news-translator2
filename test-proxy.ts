import { getPlatformProxy } from "wrangler";
async function main() {
  const { env, dispose } = await getPlatformProxy();
  console.log("DB keys:", Object.keys(env.DB || {}));
  await dispose();
}
main().catch(console.error);
