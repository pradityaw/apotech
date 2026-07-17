// Market scanner: pulls trending Base pairs from DexScreener, applies the risk
// filters from config, and runs GoPlus token-security screening on survivors.
// Output: ranked candidate list (JSON) for the operator to review before trading.
// Usage: node src/scan.mjs [searchQuery]
import { APIS, RISK, TOKENS } from "../config.mjs";

const query = process.argv[2] ?? "base";

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

// DexScreener token-boosts/search endpoints are keyless.
const data = await getJson(`${APIS.dexscreener}/latest/dex/search?q=${encodeURIComponent(query)}`);
const now = Date.now();

let pairs = (data.pairs ?? [])
  .filter((p) => p.chainId === "base")
  .filter((p) => (p.liquidity?.usd ?? 0) >= RISK.minPairLiquidityUsd)
  .filter((p) => p.pairCreatedAt && (now - p.pairCreatedAt) / 3.6e6 >= RISK.minPairAgeHours)
  .filter((p) => [TOKENS.WETH.address, TOKENS.USDC.address].map((a) => a.toLowerCase()).includes(p.quoteToken?.address?.toLowerCase()));

// Momentum score: recent volume-weighted price change, penalized by drawdown risk proxy.
for (const p of pairs) {
  const ch1h = p.priceChange?.h1 ?? 0;
  const ch6h = p.priceChange?.h6 ?? 0;
  const vol1h = p.volume?.h1 ?? 0;
  const liq = p.liquidity?.usd ?? 1;
  p._score = (ch1h * 0.6 + ch6h * 0.4) * Math.log10(1 + vol1h) * Math.min(1, vol1h / liq);
}
pairs.sort((a, b) => b._score - a._score);
pairs = pairs.slice(0, 10);

// GoPlus security screen on the top candidates.
const addrs = pairs.map((p) => p.baseToken.address).join(",");
let security = {};
if (addrs && RISK.requireGoPlusClean) {
  const sec = await getJson(`${APIS.goplus}/api/v1/token_security/8453?contract_addresses=${addrs}`);
  security = sec.result ?? {};
}

const out = pairs.map((p) => {
  const s = security[p.baseToken.address.toLowerCase()] ?? {};
  const flags = [];
  if (s.is_honeypot === "1") flags.push("HONEYPOT");
  if (Number(s.buy_tax ?? 0) > 0.02 || Number(s.sell_tax ?? 0) > 0.02) flags.push("HIGH_TAX");
  if (s.is_mintable === "1") flags.push("MINTABLE");
  if (s.owner_change_balance === "1") flags.push("OWNER_CAN_DRAIN");
  if (s.cannot_sell_all === "1") flags.push("CANNOT_SELL_ALL");
  return {
    symbol: p.baseToken.symbol,
    token: p.baseToken.address,
    pair: p.pairAddress,
    dex: p.dexId,
    priceUsd: p.priceUsd,
    liqUsd: p.liquidity?.usd,
    vol1h: p.volume?.h1,
    ch1h: p.priceChange?.h1,
    ch6h: p.priceChange?.h6,
    ch24h: p.priceChange?.h24,
    score: Number(p._score?.toFixed(3)),
    securityFlags: flags,
    tradeable: flags.length === 0,
  };
});

console.log(JSON.stringify(out, null, 2));
