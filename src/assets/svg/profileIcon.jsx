import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0M6.5 7.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0m9.758 7.484A7.99 7.99 0 0 1 10 18a7.99 7.99 0 0 1-6.258-3.016C5.363 13.821 7.575 13 10 13s4.637.821 6.258 1.984"
      fill="#05b279"
    />
  </Svg>
);
export default SVGComponent;
