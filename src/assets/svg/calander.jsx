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
      d="M5.334 1.334v2m5.333-2v2M2.334 6.06h11.333M14 5.667v5.667c0 2-1 3.333-3.333 3.333H5.333C3 14.667 2 13.334 2 11.334V5.667c0-2 1-3.333 3.333-3.333h5.334C13 2.334 14 3.667 14 5.667"
      stroke="#6b7280"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.463 9.134h.006m-.006 2h.006m-2.472-2h.006m-.006 2h.006m-2.473-2h.005m-.005 2h.005"
      stroke="#6b7280"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
