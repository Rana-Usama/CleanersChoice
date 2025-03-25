/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { FirebaseApp, initializeApp } from '@react-native-firebase/app';

initializeApp();


AppRegistry.registerComponent(appName, () => App);
