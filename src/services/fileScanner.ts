import fs from 'fs';
import path from 'path';
import { config } from '../config/config';
import { FileInfo } from '../types/file.types';
import { log } from '../utils/logger';

export async function scan(dir: string): Promise<FileInfo[]> {
  try {
    const entries = await fs.promises.readdir(dir);
    const files: FileInfo[] = [];
    const archiveDirName = path.basename(path.resolve(config.archiveDir));

    for (const entry of entries) {
      // Explicitly skip agent-owned paths.
      if (entry === archiveDirName || entry === '.gitkeep') {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = await fs.promises.stat(fullPath);

      // Filter to regular files only
      if (stat.isFile()) {
        const createdAt = getStableCreatedAt(stat);
        files.push({
          path: path.resolve(fullPath),
          name: entry,
          sizeBytes: stat.size,
          createdAt,
        });
      }
    }

    // Sort by age first, then name so duplicate resolution is deterministic.
    files.sort((a, b) => {
      const ageDelta = a.createdAt.getTime() - b.createdAt.getTime();
      if (ageDelta !== 0) {
        return ageDelta;
      }

      return a.name.localeCompare(b.name);
    });

    return files;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('Error', `Failed to scan directory ${dir}: ${errorMessage}`);
    return [];
  }
}

function getStableCreatedAt(stat: fs.Stats): Date {
  const birthtimeMs = stat.birthtimeMs;
  const mtimeMs = stat.mtimeMs;

  return new Date(birthtimeMs > 0 ? birthtimeMs : mtimeMs);
}
