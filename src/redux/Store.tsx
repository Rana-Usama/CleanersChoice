import {createStore, combineReducers} from 'redux';
import {userFlowReducer} from './Reducer';
import {cleanerAvailabilityReducer} from './Availability/Reducer';
import {formReducer} from './Form/Reducer';
import {userDataReducer} from './ProfileData/Rducer';
import {jobReducer} from './Job/Reducers';
import {userLocationReducer} from './location/Reducer';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
  availablity: cleanerAvailabilityReducer,
  form: formReducer,
  profile: userDataReducer,
  job: jobReducer,
  location: userLocationReducer,
});

const store = createStore(rootReducer);

export default store;
