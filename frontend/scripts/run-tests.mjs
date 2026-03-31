import { glob } from 'glob';
import { spawn } from 'node:child_process';

const testPatterns = [
  '**/*.{test,spec}.{js,jsx,ts,tsx,mts,cts}',
];

const ignored = ['**/node_modules/**', '**/.git/**'];

const matches = await glob(testPatterns, { ignore: ignored });

if (matches.length === 0) {
  console.log('No tests found. Skipping tests.');
  process.exit(0);
}

const child = spawn('pnpm', ['vitest', 'run'], { stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
