import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M11.333 13.667H4.666c-2 0-3.333-1-3.333-3.333V5.667c0-2.333 1.333-3.333 3.333-3.333h6.667c2 0 3.333 1 3.333 3.333v4.667c0 2.333-1.333 3.333-3.333 3.333"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.334 6 9.247 7.667c-.687.546-1.813.546-2.5 0L4.667 6"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
