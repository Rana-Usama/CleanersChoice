import { createStore, combineReducers } from 'redux';
import { userFlowReducer } from './Reducer';
import { cleanerAvailablityReducer } from './Availability/Reducer';
import { formReducer } from './Form/Reducer';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
  availablity : cleanerAvailablityReducer,
  form : formReducer
});

const store = createStore(rootReducer);

export default store;
