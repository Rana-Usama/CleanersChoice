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
      d="M7 7.833a1.82 1.82 0 1 0 0-3.64 1.82 1.82 0 0 0 0 3.64Z"
      stroke="#407bff"
    />
    <Path
      d="M2.111 4.952c1.15-5.052 8.634-5.046 9.777.006.67 2.963-1.172 5.471-2.788 7.023a3.03 3.03 0 0 1-4.206 0c-1.61-1.552-3.453-4.066-2.783-7.03Z"
      stroke="#407bff"
    />
  </Svg>
);
export default SVGComponent;
