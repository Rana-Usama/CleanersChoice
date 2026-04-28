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
      d="M10.017 2.426c-2.759 0-5 2.241-5 5v2.408c0 .508-.217 1.283-.476 1.717l-.958 1.591c-.592.984-.183 2.075.9 2.442 3.592 1.2 7.467 1.2 11.058 0a1.67 1.67 0 0 0 .9-2.442l-.958-1.591c-.25-.434-.466-1.209-.466-1.717V7.426c0-2.75-2.25-5-5-5Z"
      stroke="#fff"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
    />
    <Path
      d="M11.558 2.667a5.63 5.63 0 0 0-3.083 0 1.65 1.65 0 0 1 1.541-1.05c.7 0 1.3.434 1.542 1.05"
      stroke="#fff"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.517 15.883c0 1.375-1.125 2.5-2.5 2.5a2.5 2.5 0 0 1-1.767-.733 2.5 2.5 0 0 1-.733-1.767"
      stroke="#fff"
      strokeWidth={1.5}
      strokeMiterlimit={10}
    />
  </Svg>
);
export default SVGComponent;
