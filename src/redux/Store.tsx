import { createStore, combineReducers } from 'redux';
import { userFlowReducer } from './Reducer';
import { cleanerAvailablityReducer } from './Availability/Reducer';
import { formReducer } from './Form/Reducer';
import { userDataReducer } from './ProfileData/Rducer';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
  availablity : cleanerAvailablityReducer,
  form : formReducer,
  profile : userDataReducer
});

const store = createStore(rootReducer);

export default store;
