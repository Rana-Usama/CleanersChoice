import {DEFAULT_WORK_SESSION_CONFIG, parseWorkSessionConfig} from '../src/utils/workSessionConfig';
import {getWorkSessionConfig} from '../src/services/workSessionConfigService';

const mockGet = jest.fn();
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: () => ({doc: () => ({get: mockGet})}),
}));

beforeEach(() => mockGet.mockReset());

it('keeps tracking disabled until a complete valid config is available', () => {
  for (const config of [null, {}, {enabled: true}, {...DEFAULT_WORK_SESSION_CONFIG, enabled: 'true'},
    {...DEFAULT_WORK_SESSION_CONFIG, enabled: true, graceHours: -1},
    {...DEFAULT_WORK_SESSION_CONFIG, enabled: true, hardCapHours: 13},
    {...DEFAULT_WORK_SESSION_CONFIG, enabled: true, hardCapHours: 2},
    {...DEFAULT_WORK_SESSION_CONFIG, enabled: true, manualEntryMaxAgeDays: 1.5}]) {
    expect(parseWorkSessionConfig(config)).toEqual(DEFAULT_WORK_SESSION_CONFIG);
  }
});

it('accepts valid remote timing changes', () => {
  const config = {enabled: true, graceHours: 2, hardCapHours: 10, manualEntryMaxAgeDays: 5};
  expect(parseWorkSessionConfig(config)).toEqual(config);
});

it('requires a server read and respects the kill switch', async () => {
  mockGet.mockResolvedValue({exists: true, data: () => DEFAULT_WORK_SESSION_CONFIG});
  expect(await getWorkSessionConfig()).toEqual(DEFAULT_WORK_SESSION_CONFIG);
  expect(mockGet).toHaveBeenCalledWith({source: 'server'});
});

it('falls back to disabled for a missing document or network failure', async () => {
  mockGet.mockResolvedValue({exists: false});
  expect((await getWorkSessionConfig()).enabled).toBe(false);
  mockGet.mockRejectedValue(new Error('offline'));
  expect((await getWorkSessionConfig()).enabled).toBe(false);
});
