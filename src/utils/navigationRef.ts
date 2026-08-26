import {createNavigationContainerRef} from '@react-navigation/native';
import type {RootStackParamList} from '../routers/StackNavigator';

/**
 * Container-level navigation ref.
 *
 * Notification taps are handled outside React (index.js registers the FCM
 * listeners before the app tree mounts), so they cannot use the `navigation`
 * prop. This ref is the supported way to drive navigation from there.
 *
 * Type-only import of RootStackParamList keeps this module free of a runtime
 * dependency on StackNavigator, which imports this file back.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
