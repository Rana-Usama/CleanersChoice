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
      d="M7.975 15.683a.62.62 0 0 1-.441-.183l-5.059-5.06a.63.63 0 0 1 0-.883L7.534 4.5a.63.63 0 0 1 .883 0 .63.63 0 0 1 0 .883L3.8 10l4.617 4.616a.63.63 0 0 1 0 .884.6.6 0 0 1-.442.183"
      fill="#000"
    />
    <Path
      d="M17.084 10.625H3.059A.63.63 0 0 1 2.434 10a.63.63 0 0 1 .625-.625h14.025a.63.63 0 0 1 .625.625.63.63 0 0 1-.625.625"
      fill="#000"
    />
  </Svg>
);
export default SVGComponent;
