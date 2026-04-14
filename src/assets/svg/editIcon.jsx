import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    width={10}
    height={10}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M4.583.834H3.75C1.666.834.833 1.667.833 3.751v2.5c0 2.083.833 2.916 2.917 2.916h2.5c2.083 0 2.916-.833 2.916-2.916v-.834"
      stroke="#4d85fe"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.684 1.258 3.4 4.542a1.13 1.13 0 0 0-.275.55l-.179 1.254c-.066.454.254.77.709.708l1.254-.18c.175-.024.42-.15.55-.274l3.283-3.283c.567-.567.833-1.225 0-2.059-.833-.833-1.492-.566-2.058 0"
      stroke="#4d85fe"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.213 1.729A2.98 2.98 0 0 0 8.27 3.787"
      stroke="#4d85fe"
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
