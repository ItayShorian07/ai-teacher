import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEnvironmentPair, resolveDeploymentOrigin } from '../lib/runtime-environment';

test('production and non-production environments only accept their own data', () => {
  assert.doesNotThrow(() => assertEnvironmentPair({ appEnvironment:'production', dataEnvironment:'production', configured:true }));
  assert.doesNotThrow(() => assertEnvironmentPair({ appEnvironment:'preview', dataEnvironment:'development', configured:true }));
  assert.doesNotThrow(() => assertEnvironmentPair({ appEnvironment:'development', dataEnvironment:'development', configured:true }));
  assert.throws(() => assertEnvironmentPair({ appEnvironment:'production', dataEnvironment:'development', configured:true }), /ENVIRONMENT_DATA_MISMATCH/);
  assert.throws(() => assertEnvironmentPair({ appEnvironment:'preview', dataEnvironment:'production', configured:true }), /ENVIRONMENT_DATA_MISMATCH/);
});

test('configured connections require explicit environment labels', () => {
  assert.doesNotThrow(() => assertEnvironmentPair({ appEnvironment:undefined, dataEnvironment:undefined, configured:false }));
  assert.throws(() => assertEnvironmentPair({ appEnvironment:undefined, dataEnvironment:'development', configured:true }), /INVALID_APP_ENVIRONMENT/);
  assert.throws(() => assertEnvironmentPair({ appEnvironment:'preview', dataEnvironment:undefined, configured:true }), /INVALID_DATA_ENVIRONMENT/);
});

test('production uses the canonical site URL', () => {
  assert.equal(resolveDeploymentOrigin({
    appEnvironment:'production',
    requestOrigin:'https://untrusted.example',
    siteUrl:'https://ai-teacher-three-pied.vercel.app/path',
  }), 'https://ai-teacher-three-pied.vercel.app');
});

test('preview accepts only an alias supplied by Vercel', () => {
  const aliases=['feature-example.vercel.app','branch-example.vercel.app'];
  assert.equal(resolveDeploymentOrigin({
    appEnvironment:'preview', requestOrigin:'https://branch-example.vercel.app/login', vercelUrls:aliases,
  }), 'https://branch-example.vercel.app');
  assert.equal(resolveDeploymentOrigin({
    appEnvironment:'preview', requestOrigin:'https://attacker.example', vercelUrls:aliases,
  }), 'https://feature-example.vercel.app');
  assert.throws(() => resolveDeploymentOrigin({
    appEnvironment:'preview', requestOrigin:'https://attacker.example', vercelUrls:[],
  }), /INVALID_PREVIEW_ORIGIN/);
});

test('development only accepts a loopback origin', () => {
  assert.equal(resolveDeploymentOrigin({
    appEnvironment:'development', requestOrigin:'http://127.0.0.1:3100/register',
  }), 'http://127.0.0.1:3100');
  assert.throws(() => resolveDeploymentOrigin({
    appEnvironment:'development', requestOrigin:'https://example.com',
  }), /INVALID_DEVELOPMENT_ORIGIN/);
});
