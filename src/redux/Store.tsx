import {createStore, combineReducers} from 'redux';
import {userFlowReducer} from './Reducer';
import {cleanerAvailabilityReducer} from './Availability/Reducer';
import {formReducer} from './Form/Reducer';
import {userDataReducer} from './ProfileData/Rducer';
import {jobReducer} from './Job/Reducers';
import {userLocationReducer} from './location/Reducer';
import {hydrateFilterLocation} from './location/Actions';
import {
  loadFilterLocation,
  saveFilterLocation,
} from '../utils/filterLocationStorage';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
  availablity: cleanerAvailabilityReducer,
  form: formReducer,
  profile: userDataReducer,
  job: jobReducer,
  location: userLocationReducer,
});

const store = createStore(rootReducer);

/**
 * Minimal persistence for the location filter only.
 *
 * The rest of the store is intentionally session-scoped (profile, forms and
 * jobs are all refetched), so pulling in redux-persist for one slice would add
 * a dependency and a rehydration gate around the whole app. Instead the filter
 * is mirrored to AsyncStorage on change and restored once at startup.
 *
 * The reference check matters: store.subscribe fires on every dispatch, and
 * the location reducer returns the same filterLocation object unless that
 * slice actually changed, so this writes only on a real filter change.
 */
let lastPersistedFilter = store.getState().location.filterLocation;
let hydrating = false;

store.subscribe(() => {
  const current = store.getState().location.filterLocation;
  if (current === lastPersistedFilter) return;

  lastPersistedFilter = current;
  // Restoring is not a change worth writing back.
  if (hydrating) return;

  saveFilterLocation(current);
});

/**
 * Called once from App so the restore is observable and ordered, rather than
 * happening as a side effect of importing the store.
 */
export const hydrateStore = async () => {
  const saved = await loadFilterLocation();
  if (!saved) return;

  hydrating = true;
  try {
    store.dispatch(hydrateFilterLocation(saved));
  } finally {
    hydrating = false;
  }
};

export default store;
