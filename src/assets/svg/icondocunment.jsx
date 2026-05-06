import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={12}
    height={12}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M4.5 11h3C10 11 11 10 11 7.5v-3C11 2 10 1 7.5 1h-3C2 1 1 2 1 4.5v3C1 10 2 11 4.5 11m3.375-6.5h-3.75m3.75 3h-3.75"
      stroke="#407bff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
