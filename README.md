# Smart File Cleanup Agent

A small Node.js and TypeScript background agent that watches a folder and automatically cleans it up on a schedule.

## What It Does

The agent scans a watched directory every 15 seconds by default and applies cleanup rules in priority order:

1. Move oversized files into `watched/archive`
2. Delete files older than the configured age threshold
3. Delete duplicate files by comparing SHA-256 hashes and keeping the oldest file
4. Skip anything that does not match a rule

It logs every decision and action, and it does not re-process files it already deleted or moved during the current session.

## How Duplicate Handling Works

Duplicate cleanup is deterministic:

- The agent keeps the oldest file.
- File age uses `createdAt`, with `mtime` as a fallback when needed.
- If two files have the same timestamp, filename order is used as a stable tie-breaker.

To keep the scan efficient, hashing only happens after the cheaper size and age checks miss.

## Project Structure

```text
src/
  agent/cleanupAgent.ts
  services/fileScanner.ts
  services/ruleEngine.ts
  services/actionService.ts
  config/config.ts
  types/file.types.ts
  utils/logger.ts
  index.ts

scripts/
  generateTestFiles.ts
```

## Configuration

All settings are environment-variable driven.

| Key | Env var | Default |
| --- | --- | --- |
| watch directory | `WATCH_DIR` | `./watched` |
| archive directory | `ARCHIVE_DIR` | `./watched/archive` |
| age threshold | `AGE_MS` | `60000` |
| size threshold | `SIZE_B` | `50000` |
| scan interval | `SCAN_MS` | `15000` |

## Run It

Install dependencies:

```bash
npm install
```

Start the agent in development mode:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Run the compiled output:

```bash
npm start
```

## Demo Workflow

Generate sample files that trigger all three rules:

```bash
npm run generate
```

Then start the agent:

```bash
npm run dev
```

The generator creates:

- an old text file that will be deleted
- a large binary file that will be archived
- two matching text files so the newer duplicate gets deleted

## Example Log

```text
[2026-05-06T07:29:11.741Z] [Agent   ] Scanning directory... (4 files found)
[2026-05-06T07:29:11.742Z] [Decision] old-log.txt -> DELETE (older than 61s)
[2026-05-06T07:29:11.742Z] [Action  ] Deleted old-log.txt
[2026-05-06T07:29:11.742Z] [Decision] large-report.bin -> MOVE (size 49.8KB exceeds 48.8KB threshold)
[2026-05-06T07:29:11.744Z] [Action  ] Moved large-report.bin -> watched/archive/large-report.bin
[2026-05-06T07:29:11.745Z] [Decision] original.txt -> SKIP (no rules matched)
[2026-05-06T07:29:11.746Z] [Decision] copy.txt -> DELETE (duplicate of original.txt)
[2026-05-06T07:29:11.746Z] [Action  ] Deleted copy.txt
```

## Notes

- The watcher is flat, not recursive.
- Processed-file memory is in-memory only, so it resets when the process restarts.
- `SKIP` files are re-evaluated on later scans because they may become old enough to qualify.
