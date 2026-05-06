import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileInfo, Decision } from '../types/file.types';
import { config } from '../config/config';

/**
 * Evaluates a file against cleanup rules in priority order.
 * Rules are applied in this order: Size → Age → Duplicate → Default
 * First match wins and returns immediately.
 *
 * @param file - The file to evaluate
 * @param seenHashes - Map of SHA-256 hashes to original file paths (for duplicate detection).
 *                     MUTATED as a side effect: hashes of processed files are stored here.
 * @returns A Decision object with action and reason
 */
export async function evaluate(
  file: FileInfo,
  seenHashes: Map<string, string>
): Promise<Decision> {
  // Rule 1: Size rule
  if (file.sizeBytes > config.sizeThresholdBytes) {
    const kb = (file.sizeBytes / 1024).toFixed(1);
    const thresholdKb = (config.sizeThresholdBytes / 1024).toFixed(1);
    return {
      action: 'MOVE',
      reason: `size ${kb}KB exceeds ${thresholdKb}KB threshold`,
    };
  }

  // Rule 2: Age rule
  const ageMs = Date.now() - file.createdAt.getTime();
  if (ageMs > config.ageThresholdMs) {
    const seconds = Math.floor(ageMs / 1000);
    return {
      action: 'DELETE',
      reason: `older than ${seconds}s`,
    };
  }

  // Rule 3: Duplicate rule (lazy evaluation — only runs if size and age rules miss)
  try {
    // Compute SHA-256 hash
    const content = await fs.promises.readFile(file.path);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Mutate the file object to store the hash
    file.hash = hash;

    if (seenHashes.has(hash)) {
      const originalPath = seenHashes.get(hash)!;
      const originalName = path.basename(originalPath);
      return {
        action: 'DELETE',
        reason: `duplicate of ${originalName}`,
      };
    }

    // Record this file's hash as seen
    seenHashes.set(hash, file.path);
  } catch {
    return {
      action: 'SKIP',
      reason: 'could not read file for duplicate check',
    };
  }

  // Rule 4: Default
  return {
    action: 'SKIP',
    reason: 'no rules matched',
  };
}
