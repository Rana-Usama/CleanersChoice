import { createStore, combineReducers } from 'redux';
import { userFlowReducer } from './Reducer';
import { cleanerAvailablityReducer } from './Availability/Reducer';
import { formReducer } from './Form/Reducer';
import { userDataReducer } from './ProfileData/Rducer';
import { jobReducer } from './Job/Reducers';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
  availablity : cleanerAvailablityReducer,
  form : formReducer,
  profile : userDataReducer,
  job : jobReducer
});

const store = createStore(rootReducer);

export default store;
