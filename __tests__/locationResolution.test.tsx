import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import {PermissionsAndroid, Platform} from 'react-native';
import {useCurrentLocation} from '../src/utils/userLocation';

const mockPosition = jest.fn();
const mockGet = jest.fn();
const mockAddress = jest.fn();
const mockStorage = jest.fn();
const mockAuthorization = jest.fn();
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: (...args: any[]) => mockPosition(...args),
  setRNConfiguration: jest.fn(),
  requestAuthorization: (...args: any[]) => mockAuthorization(...args),
}));
jest.mock('@react-native-firebase/auth', () => () => ({currentUser: {uid: 'cleaner'}}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: (name: string) => ({doc: () => ({get: () => mockGet(name), update: jest.fn()})}),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (key: string) => mockStorage(key), setItem: jest.fn(async () => {}),
}));
jest.mock('axios', () => ({get: (...args: any[]) => mockAddress(...args)}));

const pending = () => new Promise<any>(() => {});
let result: ReturnType<typeof useCurrentLocation>;
let tree: ReactTestRenderer;
const Probe = () => { result = useCurrentLocation({savedLocationFallback: true}); return null; };
const advance = async (ms: number) => {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  mockStorage.mockImplementation(async key => key === '@location_disclosure_accepted' ? 'true' : 'Customer');
  mockGet.mockResolvedValue({data: () => undefined});
  mockAddress.mockImplementation(pending);
  mockPosition.mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
const mount = async () => { await act(async () => { tree = create(<Probe />); }); };

it('releases the loader immediately when GPS succeeds even if geocoding hangs', async () => {
  mockPosition.mockImplementation(success => success({coords: {latitude: 31, longitude: 74}}));
  await mount();
  expect(result.location).toMatchObject({latitude: 31, longitude: 74});
  expect(result.resolving).toBe(false);
  expect(result.loading).toBe(false);
});

it('stops resolving when GPS and both saved-location reads hang', async () => {
  mockGet.mockImplementation(pending);
  await mount();
  await advance(31000);
  expect(result.resolving).toBe(false);
  expect(result.failure).toBe('timeout');
});

it('bounds a permission request that never calls back', async () => {
  (PermissionsAndroid.request as jest.Mock).mockImplementation(pending);
  await mount();
  await advance(21000);
  expect(result.resolving).toBe(false);
  expect(result.error).toBeTruthy();
});

it('uses the service address when the last-known-location read hangs', async () => {
  mockPosition.mockImplementation((_success, failure) => failure({code: 2}));
  mockGet.mockImplementation(name => name === 'Users' ? pending() : Promise.resolve({
    data: () => ({location: {latitude: 31, longitude: 74, name: 'Saved address'}}),
  }));
  await mount();
  await advance(6000);
  expect(result.resolving).toBe(false);
  expect(result.locationSource).toBe('serviceAddress');
});

it('keeps consent available instead of spinning when storage hangs', async () => {
  mockStorage.mockImplementation(pending);
  await mount();
  await advance(4000);
  expect(result.resolving).toBe(false);
  expect(result.disclosureVisible).toBe(true);
  expect(mockPosition).not.toHaveBeenCalled();
});

it('also bounds an iOS authorization callback that never arrives', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await mount();
  await advance(21000);
  expect(mockAuthorization).toHaveBeenCalled();
  expect(result.resolving).toBe(false);
});

it('ignores a late GPS callback from an earlier attempt after retry succeeds', async () => {
  let oldSuccess: any;
  mockPosition.mockImplementationOnce(success => { oldSuccess = success; });
  await mount();
  mockPosition.mockImplementationOnce(success => success({coords: {latitude: 32, longitude: 75}}));
  await act(async () => { await result.refresh(); });
  await act(async () => { await oldSuccess({coords: {latitude: 10, longitude: 20}}); });
  expect(result.location).toMatchObject({latitude: 32, longitude: 75});
  expect(result.resolving).toBe(false);
});
