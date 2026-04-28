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
      d="M8 8.953a2.08 2.08 0 1 0 0-4.16 2.08 2.08 0 0 0 0 4.16Z"
      stroke="#6b7280"
    />
    <Path
      d="M2.413 5.66c1.314-5.774 9.867-5.767 11.174.006.766 3.387-1.34 6.254-3.187 8.027a3.46 3.46 0 0 1-4.807 0c-1.84-1.773-3.946-4.647-3.18-8.033Z"
      stroke="#6b7280"
    />
  </Svg>
);
export default SVGComponent;
