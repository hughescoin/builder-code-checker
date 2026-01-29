# 8021 Attribution Checker

Validate whether Base blockchain transactions are 8021 attributed by checking if the last 16 bytes of input data match the pattern `80218021802180218021802180218021`.

Learn more: [ERC-8021](https://eip.tools/eip/8021)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a transaction hash.

## API

### Verify Attribution

**Endpoint:** `POST /api/v1/verify`

**Request:**
```json
{
  "hash": "0x...",
  "isUserOperation": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hash` | string | Transaction or userOperation hash |
| `isUserOperation` | boolean | Set `true` for Account Abstraction transactions |

**Response:**
```json
{
  "success": true,
  "attributed": true,
  "data": {
    "hash": "0x...",
    "isUserOperation": false,
    "schemaId": 0,
    "codes": ["baseapp"],
    "suffix": "80218021802180218021802180218021",
    "inputData": "0x..."
  }
}
```

**Example:**
```bash
curl -X POST https://your-domain.com/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{"hash": "0x6e864ef...", "isUserOperation": false}'
```

Also supports `GET /api/v1/verify?hash=0x...&isUserOperation=false`
