import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={14}
    height={14}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="m6.12 1.302-2.912 1.09c-.67.251-1.219 1.045-1.219 1.762v4.334c0 .689.455 1.593 1.01 2.007l2.508 1.873c.822.618 2.176.618 2.998 0l2.508-1.873c.555-.414 1.01-1.318 1.01-2.007V4.154c0-.717-.549-1.51-1.22-1.762l-2.91-1.09c-.496-.181-1.29-.181-1.774 0"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 6.37h-.076a1.028 1.028 0 0 1 .04-2.053A1.028 1.028 0 0 1 7 6.37M5.839 8.003c-.56.373-.56.986 0 1.36.636.425 1.68.425 2.316 0 .56-.374.56-.987 0-1.36-.63-.426-1.674-.426-2.316 0"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
