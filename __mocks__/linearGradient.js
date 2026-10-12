/**
 * react-native-linear-gradient is a native module with no JS fallback, so it
 * renders as a plain View under the test renderer. The work record screens
 * reach it through WorkRecordLayout's header band.
 */
const React = require('react');
const {View} = require('react-native');

const LinearGradient = ({children, ...rest}) =>
  React.createElement(View, rest, children);

module.exports = LinearGradient;
module.exports.default = LinearGradient;
