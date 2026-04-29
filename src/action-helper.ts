/**
 * Lightweight reimplementation of the @actions/core@3.0.1 functions we use.
 *
 * @actions/core unconditionally imports oidc-utils → @actions/http-client → undici,
 * which adds ~400KB to the bundle. esbuild cannot tree-shake it because those packages
 * lack "sideEffects": false and the imports execute at module load time.
 *
 * @see https://github.com/actions/toolkit/issues/1436
 */
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync } from 'node:fs';
import { EOL } from 'node:os';

export interface InputOptions {
  required?: boolean;
  trimWhitespace?: boolean;
}

export const getInput = (name: string, options?: InputOptions): string => {
  const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
  if (options?.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  if (options?.trimWhitespace === false) {
    return val;
  }
  return val.trim();
}

export const setOutput = (name: string, value: unknown): void => {
  const filePath = process.env['GITHUB_OUTPUT'] || '';
  if (filePath) {
    issueFileCommand('OUTPUT', prepareKeyValueMessage(name, value));
    return;
  }
  process.stdout.write(`${EOL}::set-output name=${name}::${toCommandValue(value)}${EOL}`);
}

export const setFailed = (message: string | Error): void => {
  process.exitCode = 1;
  const msg = message instanceof Error ? message.toString() : message;
  process.stdout.write(`::error::${escapeData(msg)}${EOL}`);
}

export const info = (message: string): void => {
  process.stdout.write(message + EOL);
}

const toCommandValue = (input: unknown): string => {
  if (input === null || input === undefined) {
    return '';
  }
  if (typeof input === 'string') {
    return input;
  }
  return JSON.stringify(input);
}

const escapeData = (s: unknown): string => toCommandValue(s)
  .replace(/%/g, '%25')
  .replace(/\r/g, '%0D')
  .replace(/\n/g, '%0A');

const issueFileCommand = (command: string, message: string): void => {
  const filePath = process.env[`GITHUB_${command}`];
  if (!filePath) {
    throw new Error(`Unable to find environment variable for file command ${command}`);
  }
  if (!existsSync(filePath)) {
    throw new Error(`Missing file at path: ${filePath}`);
  }
  appendFileSync(filePath, `${message}${EOL}`, { encoding: 'utf8' });
}

const prepareKeyValueMessage = (key: string, value: unknown): string => {
  const delimiter = `ghadelimiter_${randomUUID()}`;
  const convertedValue = toCommandValue(value);
  if (key.includes(delimiter)) {
    throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
  }
  if (convertedValue.includes(delimiter)) {
    throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
  }
  return `${key}<<${delimiter}${EOL}${convertedValue}${EOL}${delimiter}`;
}
