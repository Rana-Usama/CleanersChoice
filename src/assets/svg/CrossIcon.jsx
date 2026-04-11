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
      d="m7.054 12.945 5.893-5.891m-5.893 0 5.893 5.891"
      stroke="#000000"
      strokeOpacity={1}
      strokeLinecap="round"
    />
  </Svg>
);
export default SVGComponent;
