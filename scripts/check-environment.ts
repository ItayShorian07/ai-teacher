import { loadEnvConfig } from '@next/env';
import targets from '../config/environments.json';
import { appEnvironment, environmentErrors } from '../lib/environment';

loadEnvConfig(process.cwd(), process.argv.includes('--development'));

const errors = environmentErrors(process.env, targets);
if (errors.length) {
  for (const error of errors) console.error(error);
  console.error('See docs/WORKFLOW.he.md. No credential values were printed.');
  process.exitCode = 1;
} else {
  console.log(
    `Environment configuration is valid: ${appEnvironment(process.env)}.`,
  );
  console.log(
    'This checks configuration only; provider settings and data isolation need integration tests.',
  );
}
