import {StyleSheet, Text, View, StatusBar} from 'react-native';
import React from 'react';
import StackNavigator from './src/routers/StackNavigator';
import {Provider} from 'react-redux';
import store from './src/redux/Store';
import Toast from 'react-native-toast-message';
import {StripeProvider} from '@stripe/stripe-react-native';
import {PUBLISHABLE_KEY} from '@env';

const App: React.FC = () => {
  return (
    <StripeProvider publishableKey={PUBLISHABLE_KEY}>
      <Provider store={store}>
        <StatusBar
          barStyle={'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <StackNavigator />
        <Toast />
      </Provider>
    </StripeProvider>
  );
};

export default App;

const styles = StyleSheet.create({});
