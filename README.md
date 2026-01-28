# 8021 Attribution Checker

Validate whether Base blockchain transactions are 8021 attributed by checking if the last 16 bytes of input data match the pattern `80218021802180218021802180218021`.

Learn more: [ERC-8021](https://eip.tools/eip/8021)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a transaction hash.

## Example

```
Transaction: 0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce
Result: 8021 Attributed ✓
```
