export interface FileInfo {
  path: string;       // absolute path to file
  name: string;       // filename only (no directory)
  sizeBytes: number;
  createdAt: Date;
  hash?: string;      // SHA-256, populated lazily by RuleEngine when needed
}

export interface Decision {
  action: 'DELETE' | 'MOVE' | 'SKIP';
  reason: string;
}
