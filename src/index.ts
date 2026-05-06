import { CleanupAgent } from './agent/cleanupAgent';

const agent = new CleanupAgent();
agent.start();

process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  agent.stop();
  process.exit(0);
});
