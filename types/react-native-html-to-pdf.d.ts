declare module 'react-native-html-to-pdf' {
  interface RNHTMLtoPDFOptions {
    html: string;
    fileName?: string;
    base64?: boolean;
    directory?: string;
    height?: number;
    width?: number;
    padding?: number;
  }

  interface RNHTMLtoPDFResponse {
    filePath: string;
    base64?: string;
  }

  export default {
    convert(options: RNHTMLtoPDFOptions): Promise<RNHTMLtoPDFResponse>;
  };
}
