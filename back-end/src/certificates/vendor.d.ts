declare module 'svg-to-pdfkit' {
  import type PDFDocument from 'pdfkit';
  type Options = {
    assumePt?: boolean;
    fontCallback?: (family: string, bold: boolean, italic: boolean) => string;
    warningCallback?: (message: string) => void;
  };
  export default function SVGtoPDF(doc: InstanceType<typeof PDFDocument>, svg: string, x: number, y: number, options?: Options): void;
}

declare module 'fontkit' {
  export type Font = { unitsPerEm: number; layout(text: string): { advanceWidth: number } };
  export function openSync(path: string): Font;
}
