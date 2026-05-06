import fs from 'fs';
import path from 'path';
import { Decision, FileInfo } from '../types/file.types';
import { config } from '../config/config';
import { log } from '../utils/logger';

export async function execute(file: FileInfo, decision: Decision): Promise<boolean> {
  try {
    switch (decision.action) {
      case 'MOVE':
        await fs.promises.mkdir(config.archiveDir, { recursive: true });
        await fs.promises.rename(file.path, archivePathFor(file.name));
        log('Action', `Moved ${file.name} -> ${path.join(config.archiveDir, file.name)}`);
        return true;

      case 'DELETE':
        await fs.promises.unlink(file.path);
        log('Action', `Deleted ${file.name}`);
        return true;

      case 'SKIP':
        return true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('Error', `Failed to ${decision.action.toLowerCase()} ${file.name}: ${errorMessage}`);
    return false;
  }
}

function archivePathFor(fileName: string): string {
  return path.join(config.archiveDir, fileName);
}
