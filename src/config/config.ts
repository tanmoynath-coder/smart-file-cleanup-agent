export const config = {
  watchDir:           process.env.WATCH_DIR   || './watched',
  archiveDir:         process.env.ARCHIVE_DIR || './watched/archive',
  ageThresholdMs:     Number(process.env.AGE_MS)  || 60_000,   // 1 minute
  sizeThresholdBytes: Number(process.env.SIZE_B)  || 50_000,   // 50 KB
  scanIntervalMs:     Number(process.env.SCAN_MS) || 15_000,   // 15 seconds
};
