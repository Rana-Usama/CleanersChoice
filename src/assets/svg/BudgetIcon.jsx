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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.467 1.067V0h1.067v1.067h1.6A3.734 3.734 0 0 1 13.867 4.8H12.8a2.667 2.667 0 0 0-2.666-2.667H5.867a2.667 2.667 0 0 0 0 5.334h4.267a3.734 3.734 0 0 1 0 7.466h-1.6V16H7.467v-1.067h-1.6A3.733 3.733 0 0 1 2.134 11.2H3.2a2.667 2.667 0 0 0 2.667 2.667h4.267a2.667 2.667 0 0 0 0-5.334H5.867a3.733 3.733 0 1 1 0-7.466z"
      fill="#4d85fe"
    />
  </Svg>
);
export default SVGComponent;
