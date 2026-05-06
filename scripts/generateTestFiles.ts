import fs from 'fs';
import path from 'path';
import { config } from '../src/config/config';
import { log } from '../src/utils/logger';

async function main(): Promise<void> {
  await fs.promises.mkdir(config.watchDir, { recursive: true });
  await fs.promises.mkdir(config.archiveDir, { recursive: true });

  const oldFile = path.join(config.watchDir, 'old-log.txt');
  const largeFile = path.join(config.watchDir, 'large-report.bin');
  const originalFile = path.join(config.watchDir, 'original.txt');
  const duplicateFile = path.join(config.watchDir, 'copy.txt');

  await fs.promises.writeFile(oldFile, 'small old file\n');
  await fs.promises.writeFile(largeFile, Buffer.alloc(config.sizeThresholdBytes + 1024, 1));
  await fs.promises.writeFile(originalFile, 'same duplicate content\n');
  await sleep(50);
  await fs.promises.writeFile(duplicateFile, 'same duplicate content\n');

  const oldTime = new Date(Date.now() - config.ageThresholdMs - 1000);
  await fs.promises.utimes(oldFile, oldTime, oldTime);

  log('Generate', `Created demo files in ${config.watchDir}`);
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  log('Error', `Failed to generate demo files: ${errorMessage}`);
  process.exitCode = 1;
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
