import { config } from '../config/config';
import { scan } from '../services/fileScanner';
import { execute } from '../services/actionService';
import { evaluate } from '../services/ruleEngine';
import { log } from '../utils/logger';

export class CleanupAgent {
  private readonly processedPaths = new Set<string>();
  private timer?: NodeJS.Timeout;
  private running = false;

  start(): void {
    if (this.timer) {
      return;
    }

    log('Agent', `Starting cleanup agent for ${config.watchDir}`);
    void this.runCycle();
    this.timer = setInterval(() => void this.runCycle(), config.scanIntervalMs);
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
    log('Agent', 'Stopped cleanup agent');
  }

  async runCycle(): Promise<void> {
    if (this.running) {
      log('Agent', 'Skipping scan; previous cycle still running');
      return;
    }

    this.running = true;
    const seenHashes = new Map<string, string>();

    try {
      const files = await scan(config.watchDir);
      log('Agent', `Scanning directory... (${files.length} files found)`);

      for (const file of files) {
        if (this.processedPaths.has(file.path)) {
          continue;
        }

        const decision = await evaluate(file, seenHashes);
        log('Decision', `${file.name} -> ${decision.action} (${decision.reason})`);

        const completed = await execute(file, decision);
        if (completed && decision.action !== 'SKIP') {
          this.processedPaths.add(file.path);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
