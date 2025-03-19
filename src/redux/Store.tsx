import { createStore, combineReducers } from 'redux';
import { userFlowReducer } from './Reducer';

const rootReducer = combineReducers({
  userFlow: userFlowReducer,
});

const store = createStore(rootReducer);

export default store;
