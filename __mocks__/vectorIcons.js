/**
 * react-native-vector-icons ships untranspiled ESM, so importing it in a test
 * fails with "Cannot use import statement outside a module". Transforming it
 * instead of stubbing it works, but roughly doubled the work suite's runtime
 * (24s -> 48s) and pushed the slowest test past the default 5s timeout.
 *
 * Icons carry no behaviour these tests assert on, so they render as a plain
 * element that keeps the icon name queryable.
 */
const React = require('react');
const {Text} = require('react-native');

const Icon = ({name, ...rest}) =>
  React.createElement(Text, {accessibilityLabel: name, ...rest}, null);

Icon.loadFont = () => Promise.resolve();
Icon.getImageSource = () => Promise.resolve(null);

module.exports = Icon;
module.exports.default = Icon;
