declare module '@env' {
  export const GOOGLE_PLACES_API_KEY: string;
   export const PUBLISHABLE_KEY: string; 
}

declare module 'react-native-html-to-pdf' {
  interface PDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    padding?: number;
    bgColor?: string;
  }
  interface PDFResult {
    filePath: string;
    base64?: string;
  }
  const RNHTMLtoPDF: {
    convert(options: PDFOptions): Promise<PDFResult>;
  };
  export default RNHTMLtoPDF;
}
