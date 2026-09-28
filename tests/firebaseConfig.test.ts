import {
  getMissingFirebaseConfigKeys,
  type RequiredFirebaseConfigKey,
} from '../app/firebaseConfig';

interface TestCase {
  name: string;
  run: () => void;
}

function assertArrayEqual<T>(actual: T[], expected: T[], message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nReceived: ${actualJson}`);
  }
}

function entry(envKey: RequiredFirebaseConfigKey, value?: string) {
  return { envKey, value };
}

const tests: TestCase[] = [
  {
    name: 'reports no missing Firebase config keys when required values are present',
    run: () => {
      const missingKeys = getMissingFirebaseConfigKeys([
        entry('EXPO_PUBLIC_FIREBASE_API_KEY', 'api-key'),
        entry('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'portfolio-mini.firebaseapp.com'),
        entry('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'portfolio-mini'),
        entry('EXPO_PUBLIC_FIREBASE_APP_ID', '1:123:web:abc'),
      ]);

      assertArrayEqual(
        missingKeys,
        [],
        'Expected production-style static Firebase config values to enable auth.',
      );
    },
  },
  {
    name: 'reports only required Firebase config keys with missing values',
    run: () => {
      const missingKeys = getMissingFirebaseConfigKeys([
        entry('EXPO_PUBLIC_FIREBASE_API_KEY', 'api-key'),
        entry('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        entry('EXPO_PUBLIC_FIREBASE_PROJECT_ID', ''),
        entry('EXPO_PUBLIC_FIREBASE_APP_ID', '1:123:web:abc'),
      ]);

      assertArrayEqual(
        missingKeys,
        [
          'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
        ],
        'Expected only absent required Firebase config values to be reported.',
      );
    },
  },
];

let failedTests = 0;

for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failedTests += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}\n${message}`);
  }
}

if (failedTests > 0) {
  throw new Error(`${failedTests} Firebase config test${failedTests === 1 ? '' : 's'} failed.`);
}

console.log(`\n${tests.length} Firebase config tests passed.`);
