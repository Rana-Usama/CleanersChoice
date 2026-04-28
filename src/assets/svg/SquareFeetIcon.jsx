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
      d="M2.5 1.5H9A1.5 1.5 0 0 1 10.5 3v6.5A1.5 1.5 0 0 1 9 11H2.5A1.5 1.5 0 0 1 1 9.5V3a1.5 1.5 0 0 1 1.5-1.5m0 .5a1 1 0 0 0-1 1v1.5H4V2zm-1 7.5a1 1 0 0 0 1 1H4V8H1.5zM4 5H1.5v2.5H4zm5 5.5a1 1 0 0 0 1-1V8H7.5v2.5zM10 5H7.5v2.5H10zm0-2a1 1 0 0 0-1-1H7.5v2.5H10zM4.5 2v2.5H7V2zm0 8.5H7V8H4.5zM7 5H4.5v2.5H7z"
      fill={props.color || '#9ca3af'}
    />
  </Svg>
);
export default SVGComponent;
