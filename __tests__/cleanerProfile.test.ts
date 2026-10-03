/**
 * The new cleaner visibility rule:
 *
 *   visible = required profile (name + phone + service city/state) + active subscription
 *
 * No profile-completion percentage, description, service types, availability
 * or packages may influence it — those are asserted explicitly below because
 * re-introducing one of them is the regression this suite exists to catch.
 */
import {
  describeListingStatus,
  getMissingRequiredFields,
  hasRequiredCleanerProfile,
  isListingLive,
  requiredFieldsFromService,
  requiredFieldsFromUser,
  syncRequiredProfileMirror,
} from '../src/utils/cleanerProfile';
import {resolveCleanerRoute} from '../src/utils/cleanerRoute';
import {CLEANER_INSTRUCTIONS_VERSION} from '../src/constants/cleanerInstructions';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({currentUser: null}),
}));

jest.mock('@react-native-firebase/firestore', () => {
  const firestoreFn: any = () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const store = (global as any).__DB__[name] || {};
          const exists = Object.prototype.hasOwnProperty.call(store, id);
          return {id, exists, data: () => store[id]};
        },
        set: async (data: any, opts?: {merge?: boolean}) => {
          (global as any).__WRITES__.push({name, id, data, opts});
          const db = (global as any).__DB__;
          db[name] = db[name] || {};
          db[name][id] = opts?.merge ? {...(db[name][id] || {}), ...data} : data;
        },
      }),
    }),
  });
  firestoreFn.FieldPath = {documentId: () => '__name__'};
  return {__esModule: true, default: firestoreFn};
});

const NOW = new Date('2026-10-03T12:00:00Z').getTime();
const FUTURE = NOW + 20 * 24 * 60 * 60 * 1000;
const PAST = NOW - 24 * 60 * 60 * 1000;

const AUSTIN = {
  name: 'Austin, TX',
  city: 'Austin',
  state: 'TX',
  latitude: 30.2672,
  longitude: -97.7431,
  placeId: 'abc',
};

const completeService = {
  name: 'Sparkle Home Cleaning',
  phone: '+1-512-555-0100',
  location: AUSTIN,
  visibleUntil: FUTURE,
};

beforeEach(() => {
  (global as any).__DB__ = {};
  (global as any).__WRITES__ = [];
});

describe('required profile predicate', () => {
  it('accepts name + valid phone + city/state with coordinates', () => {
    expect(hasRequiredCleanerProfile(requiredFieldsFromService(completeService))).toBe(true);
  });

  it('reports each missing field, in order', () => {
    expect(getMissingRequiredFields({})).toEqual(['name', 'phone', 'location']);
    expect(getMissingRequiredFields({name: '   ', phone: '+1-512', location: {city: 'Austin'}})).toEqual([
      'name',
      'phone',
      'location',
    ]);
  });

  it('rejects a location without a state, or without coordinates', () => {
    expect(getMissingRequiredFields({...completeService, location: {...AUSTIN, state: ''}})).toEqual([
      'location',
    ]);
    const noCoords = {...AUSTIN, latitude: undefined};
    expect(getMissingRequiredFields({...completeService, location: noCoords})).toEqual(['location']);
  });

  it('reads Users.serviceLocation for the user-side check', () => {
    expect(
      hasRequiredCleanerProfile(
        requiredFieldsFromUser({name: 'A', phone: '+1-512-555-0100', serviceLocation: AUSTIN}),
      ),
    ).toBe(true);
  });
});

describe('isListingLive — profile + subscription, nothing else', () => {
  it('is live with ONLY the required fields (no description/types/availability/packages)', () => {
    expect(isListingLive(completeService, NOW)).toBe(true);
  });

  it('is hidden when the subscription deadline has passed', () => {
    expect(isListingLive({...completeService, visibleUntil: PAST}, NOW)).toBe(false);
    expect(isListingLive({...completeService, visibleUntil: 0}, NOW)).toBe(false);
  });

  it('is hidden when a required field is missing, even with a full optional listing', () => {
    const richButNoPhone = {
      ...completeService,
      phone: null,
      description: 'Best cleaners in town',
      type: ['11', '22'],
      availability: [{day: 'Mon', checked: true}],
      packages: [{id: 1, price: '99'}],
    };
    expect(isListingLive(richButNoPhone, NOW)).toBe(false);
  });
});

describe('describeListingStatus', () => {
  it('explains the reason, profile first', () => {
    expect(describeListingStatus({...completeService, phone: ''}, {}, NOW)).toEqual({
      live: false,
      reason: 'missing_profile',
      missing: ['phone'],
    });
    expect(describeListingStatus({...completeService, visibleUntil: PAST}, {}, NOW).reason).toBe(
      'no_subscription',
    );
    expect(describeListingStatus(completeService, {accountStatus: 'disabled'}, NOW).reason).toBe(
      'inactive_account',
    );
    expect(describeListingStatus(completeService, null, NOW).reason).toBe('inactive_account');
    expect(describeListingStatus(completeService, {}, NOW)).toEqual({live: true, reason: null, missing: []});
  });

  it('treats a missing listing document as missing profile', () => {
    expect(describeListingStatus(null, undefined, NOW).reason).toBe('missing_profile');
  });
});

describe('resolveCleanerRoute', () => {
  const accepted = {
    instructionsAccepted: true,
    instructionsVersionAccepted: CLEANER_INSTRUCTIONS_VERSION,
  };
  const required = {name: 'A', phone: '+1-512-555-0100', serviceLocation: AUSTIN};

  it('Instructions → Business info → Paywall → Dashboard', () => {
    expect(resolveCleanerRoute({})).toBe('CleanerInstructions');
    expect(resolveCleanerRoute({...accepted, subscriptionEndDate: FUTURE})).toBe('CompleteBusinessInfo');
    expect(resolveCleanerRoute({...accepted, ...required})).toBe('Premium');
    expect(resolveCleanerRoute({...accepted, ...required, subscriptionEndDate: Date.now() + 1e9})).toBe(
      'CleanerNavigator',
    );
  });
});

describe('syncRequiredProfileMirror', () => {
  const user = {
    name: 'Sparkle Home Cleaning',
    phone: '+1-512-555-0100',
    serviceLocation: AUSTIN,
    profile: 'https://img',
  };

  it('creates the listing doc (hidden, with createdAt) for a brand-new cleaner', async () => {
    const wrote = await syncRequiredProfileMirror('u1', user);
    expect(wrote).toBe(true);
    const doc = (global as any).__DB__.CleanerServices.u1;
    expect(doc.name).toBe(user.name);
    expect(doc.phone).toBe(user.phone);
    expect(doc.location).toMatchObject({city: 'Austin', state: 'TX'});
    expect(doc.visibleUntil).toBe(0);
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(doc.image).toBe('https://img');
    expect((global as any).__WRITES__[0].opts).toEqual({merge: true});
  });

  it('never overwrites a server-owned visibleUntil or optional listing details', async () => {
    (global as any).__DB__.CleanerServices = {
      u1: {
        name: 'Old name',
        description: 'kept',
        type: ['11'],
        visibleUntil: FUTURE,
        createdAt: new Date(0),
        image: 'old',
      },
    };
    await syncRequiredProfileMirror('u1', user);
    const doc = (global as any).__DB__.CleanerServices.u1;
    expect(doc.visibleUntil).toBe(FUTURE);
    expect(doc.description).toBe('kept');
    expect(doc.type).toEqual(['11']);
    expect(doc.image).toBe('old');
    expect(doc.name).toBe(user.name);
  });

  it('is a no-op when already in sync, and when the user lacks required fields', async () => {
    await syncRequiredProfileMirror('u1', user);
    (global as any).__WRITES__ = [];
    expect(await syncRequiredProfileMirror('u1', user)).toBe(false);
    expect(await syncRequiredProfileMirror('u2', {name: 'x'})).toBe(false);
    expect((global as any).__WRITES__).toHaveLength(0);
  });
});
