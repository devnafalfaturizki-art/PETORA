import '@testing-library/jest-dom';
import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@solidjs/testing-library';

beforeAll(() => {
  // Setup global test environment
});

afterEach(() => {
  cleanup();
});