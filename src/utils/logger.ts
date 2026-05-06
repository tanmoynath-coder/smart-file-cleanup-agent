export function log(tag: string, message: string): void {
  const timestamp = new Date().toISOString();
  const paddedTag = tag.padEnd(8);
  console.log(`[${timestamp}] [${paddedTag}] ${message}`);
}
