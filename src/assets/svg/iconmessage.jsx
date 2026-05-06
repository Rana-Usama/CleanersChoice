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
      d="M4.959 11.083h-.292c-2.333 0-3.5-.584-3.5-3.5V4.666q0-3.5 3.5-3.5h4.667q3.5 0 3.5 3.5v2.917q0 3.5-3.5 3.5h-.292a.59.59 0 0 0-.467.233L7.7 12.483c-.385.513-1.015.513-1.4 0l-.875-1.167a.66.66 0 0 0-.466-.233"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.331 6.417h.006m-2.34 0h.006m-2.34 0h.006"
      stroke="#407bff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
