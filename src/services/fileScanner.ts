import fs from 'fs';
import path from 'path';
import { FileInfo } from '../types/file.types';
import { log } from '../utils/logger';

export async function scan(dir: string): Promise<FileInfo[]> {
  try {
    const entries = await fs.promises.readdir(dir);
    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Explicitly skip agent-owned paths.
      if (entry === 'archive' || entry === '.gitkeep') {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = await fs.promises.stat(fullPath);

      // Filter to regular files only
      if (stat.isFile()) {
        files.push({
          path: path.resolve(fullPath),
          name: entry,
          sizeBytes: stat.size,
          createdAt: stat.birthtime,
        });
      }
    }

    // Sort by createdAt ascending (oldest first)
    files.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return files;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('Error', `Failed to scan directory ${dir}: ${errorMessage}`);
    return [];
  }
}
