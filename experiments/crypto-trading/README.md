# Crypto trading experiment

One-week experiment: turn $100 into $200, trading autonomously on Base mainnet.
Operated by Claude from a Claude Code remote session. This directory is fully
isolated from the apotech application (not part of the pnpm workspace).

## Status

- [x] Wallet generated (address in chat; private key held locally + backed up by owner in Rabby — never committed)
- [ ] **BLOCKED: network egress policy** — this environment currently denies all
      crypto RPC/API hosts (403 from the org egress proxy). Trading cannot start
      until the hosts below are allowed for this environment.
- [ ] Wallet funded (~$100 of ETH on **Base** network)
- [ ] Pre-flight `node src/verify.mjs` passed
- [ ] Trading live

## Required network allowlist

| Host | Purpose |
|------|---------|
| `mainnet.base.org` | Base RPC (read chain + broadcast txs) |
| `base.publicnode.com` | Backup RPC |
| `base.llamarpc.com` | Backup RPC |
| `api.dexscreener.com` | Pair discovery, prices, volume |
| `api.gopluslabs.io` | Token security / honeypot screening |
| `api.coingecko.com` | (optional) macro price context |

## Strategy

$100 → $200 in 7 days needs ~10.4%/day compounded. That is not achievable with
conservative trading, so the plan is deliberately high-variance, with hard rails
to avoid the instant-death failure modes (rugs, honeypots, illiquid exits):

1. **Venue**: Base mainnet — gas <$0.01/swap, so small-size trading is viable.
2. **Style**: short-horizon momentum rotation. Scan trending Base pairs
   (DexScreener), rank by volume-weighted 1h/6h momentum, enter strength,
   exit on stop or trailing take-profit. Hold hours, not days.
3. **Hard risk rails** (`config.mjs`, enforced in code):
   max 2 concurrent positions, ≤45% of equity each, −15% stop loss,
   20% trailing take-profit, ≥$150k pair liquidity, ≥72h pair age,
   GoPlus security screen must be clean, ≤1.5% slippage, ETH gas reserve.
4. **Execution**: Uniswap V3 on Base with on-chain QuoterV2 quotes (no
   aggregator API keys needed), exact-amount approvals, `amountOutMinimum`
   enforced on every swap.
5. **Cadence**: hourly scheduled check-ins (Routine) — mark equity, check
   stops, scan for entries, log every action to `state/journal.md`, commit.

## Operator runbook

```bash
cd experiments/crypto-trading
npm install            # once per container (deps are gitignored)
node src/verify.mjs    # pre-flight: RPC reachable, contracts verified
node src/status.mjs    # balances + open positions
node src/scan.mjs      # ranked, security-screened candidate list
node src/trade.mjs quote USDC 0xTOKEN 20      # dry-run quote
node src/trade.mjs swap  USDC 0xTOKEN 20 --yes # execute (risk-checked)
```

## Custody

- `.wallet.json` (gitignored, mode 600) holds the private key in-container.
- Containers are ephemeral: the owner keeps the same key imported in Rabby,
  so funds are recoverable by the owner at all times, independent of this
  session. The key is never committed to git.

## Honest odds statement

For the record: ~2x in a week on spot momentum trading is a low-probability
outcome (rough estimate: 10–25% even played well). The risk rails maximize the
chance of surviving long enough for variance to work, and prevent the total
losses that come from rugs/honeypots rather than from being wrong on direction.
Expected outcomes span roughly $40–$250. The $100 should be money the owner can
afford to lose entirely.
