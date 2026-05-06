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
      d="m4.51 1.42-2.695 2.1C1.365 3.87 1 4.613 1 5.18v3.704c0 1.16.945 2.11 2.105 2.11h5.79c1.16 0 2.105-.95 2.105-2.105V5.25c0-.605-.405-1.38-.9-1.725L7.01 1.36c-.7-.49-1.825-.465-2.5.06M6 8.994v-1.5"
      stroke="#407bff"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
