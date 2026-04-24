import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

const WhiteStar = props => (
  <Svg viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12 1.8l2.95 5.97 6.59.96-4.77 4.65 1.13 6.56L12 16.85 6.1 19.94l1.13-6.56L2.46 8.73l6.59-.96L12 1.8z"
      fill="#FFFFFF"
    />
  </Svg>
);

export default WhiteStar;