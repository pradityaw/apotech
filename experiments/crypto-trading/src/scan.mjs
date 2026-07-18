// Market scanner for Base. Aggregates candidate tokens from DexScreener's
// trending/boosted feeds + symbol searches, resolves each to its deepest pair,
// applies the risk filters from config, ranks by volume-weighted momentum, and
// runs GoPlus token-security screening on the survivors.
// Output: ranked candidate list (JSON) — for the engine / operator to act on.
// Usage: node src/scan.mjs [extraQuery ...]
import "./proxy.mjs"; // route global fetch through the egress proxy + CA
import { APIS, RISK, TOKENS } from "../config.mjs";

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}
const uniq = (arr) => [...new Set(arr)];

// 1) Gather candidate token addresses on Base from several sources.
const baseTokenAddrs = new Set();

async function collectBoosts(path) {
  try {
    const data = await getJson(`${APIS.dexscreener}${path}`);
    for (const b of data ?? []) {
      if (b.chainId === "base" && b.tokenAddress) baseTokenAddrs.add(b.tokenAddress.toLowerCase());
    }
  } catch (e) {
    console.error(`warn: ${path} -> ${e.message}`);
  }
}
await collectBoosts("/token-boosts/top/v1");
await collectBoosts("/token-boosts/latest/v1");

// 2) Also fold in symbol/text searches (majors + any operator-supplied queries).
const searches = uniq(["WETH", "USDC", "base", ...process.argv.slice(2)]);
const searchPairs = [];
for (const q of searches) {
  try {
    const data = await getJson(`${APIS.dexscreener}/latest/dex/search?q=${encodeURIComponent(q)}`);
    for (const p of data.pairs ?? []) if (p.chainId === "base") searchPairs.push(p);
  } catch (e) {
    console.error(`warn: search ${q} -> ${e.message}`);
  }
}

// 3) Resolve boosted token addresses to their pairs (batched, 30 addrs/call).
const addrList = [...baseTokenAddrs];
const resolvedPairs = [];
for (let i = 0; i < addrList.length; i += 30) {
  const batch = addrList.slice(i, i + 30).join(",");
  try {
    const data = await getJson(`${APIS.dexscreener}/latest/dex/tokens/${batch}`);
    for (const p of data.pairs ?? []) if (p.chainId === "base") resolvedPairs.push(p);
  } catch (e) {
    console.error(`warn: tokens batch -> ${e.message}`);
  }
}

// 4) Merge, dedupe by pair address, keep the deepest pair per base token.
const byPair = new Map();
for (const p of [...searchPairs, ...resolvedPairs]) {
  if (!p.pairAddress) continue;
  const prev = byPair.get(p.pairAddress);
  if (!prev || (p.liquidity?.usd ?? 0) > (prev.liquidity?.usd ?? 0)) byPair.set(p.pairAddress, p);
}

const now = Date.now();
const quoteWhitelist = [TOKENS.WETH.address, TOKENS.USDC.address].map((a) => a.toLowerCase());

let pairs = [...byPair.values()]
  .filter((p) => (p.liquidity?.usd ?? 0) >= RISK.minPairLiquidityUsd)
  .filter((p) => p.pairCreatedAt && (now - p.pairCreatedAt) / 3.6e6 >= RISK.minPairAgeHours)
  .filter((p) => quoteWhitelist.includes(p.quoteToken?.address?.toLowerCase()))
  // exclude WETH/USDC themselves as "candidates"
  .filter((p) => !quoteWhitelist.includes(p.baseToken?.address?.toLowerCase()));

// Momentum score: volume-weighted recent price change, scaled by turnover.
for (const p of pairs) {
  const ch1h = p.priceChange?.h1 ?? 0;
  const ch6h = p.priceChange?.h6 ?? 0;
  const vol1h = p.volume?.h1 ?? 0;
  const liq = p.liquidity?.usd ?? 1;
  p._score = (ch1h * 0.6 + ch6h * 0.4) * Math.log10(1 + vol1h) * Math.min(1, vol1h / liq);
}
pairs.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
pairs = pairs.slice(0, 12);

// 5) GoPlus security screen on the top candidates.
let security = {};
if (pairs.length && RISK.requireGoPlusClean) {
  const addrs = pairs.map((p) => p.baseToken.address).join(",");
  try {
    const sec = await getJson(`${APIS.goplus}/api/v1/token_security/8453?contract_addresses=${addrs}`);
    security = sec.result ?? {};
  } catch (e) {
    console.error(`warn: goplus -> ${e.message}`);
  }
}

const out = pairs.map((p) => {
  const s = security[p.baseToken.address.toLowerCase()] ?? {};
  const flags = [];
  if (s.is_honeypot === "1") flags.push("HONEYPOT");
  if (Number(s.buy_tax ?? 0) > 0.03 || Number(s.sell_tax ?? 0) > 0.03) flags.push("HIGH_TAX");
  if (s.cannot_sell_all === "1") flags.push("CANNOT_SELL_ALL");
  if (s.owner_change_balance === "1") flags.push("OWNER_CAN_DRAIN");
  if (s.transfer_pausable === "1") flags.push("PAUSABLE");
  if (s.is_blacklisted === "1") flags.push("BLACKLIST");
  const screened = Object.keys(s).length > 0;
  return {
    symbol: p.baseToken.symbol,
    token: p.baseToken.address,
    quote: p.quoteToken.symbol,
    dex: p.dexId,
    priceUsd: p.priceUsd,
    liqUsd: Math.round(p.liquidity?.usd ?? 0),
    vol1h: Math.round(p.volume?.h1 ?? 0),
    vol24h: Math.round(p.volume?.h24 ?? 0),
    ch1h: p.priceChange?.h1,
    ch6h: p.priceChange?.h6,
    ch24h: p.priceChange?.h24,
    ageHours: p.pairCreatedAt ? Math.round((now - p.pairCreatedAt) / 3.6e6) : null,
    score: Number((p._score ?? 0).toFixed(3)),
    buyTax: s.buy_tax,
    sellTax: s.sell_tax,
    securityFlags: flags,
    screened,
    tradeable: screened && flags.length === 0,
  };
});

console.log(JSON.stringify(out, null, 2));
console.error(`\nscanned ${byPair.size} Base pairs -> ${pairs.length} passed filters -> ${out.filter((o) => o.tradeable).length} tradeable`);
