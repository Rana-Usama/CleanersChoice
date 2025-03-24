import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store from './src/redux/Store';
import Toast from 'react-native-toast-message';
import {app} from './firebaseConfig'

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <StackNavigator />
      <Toast />
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({});
