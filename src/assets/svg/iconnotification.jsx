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
      d="M6.01 1.455c-1.655 0-3 1.345-3 3V5.9c0 .305-.13.77-.285 1.03l-.575.955c-.355.59-.11 1.245.54 1.465 2.155.72 4.48.72 6.635 0 .605-.2.87-.915.54-1.465L9.29 6.93c-.15-.26-.28-.725-.28-1.03V4.455c0-1.65-1.35-3-3-3Z"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
    />
    <Path
      d="M6.935 1.6a3.4 3.4 0 0 0-1.85 0 .993.993 0 0 1 1.85 0"
      stroke="#407bff"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.51 9.53c0 .824-.675 1.5-1.5 1.5a1.505 1.505 0 0 1-1.5-1.5"
      stroke="#407bff"
      strokeMiterlimit={10}
    />
  </Svg>
);
export default SVGComponent;
