import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store from './src/redux/Store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <StackNavigator />
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({});
