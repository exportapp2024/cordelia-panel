declare module 'pdfmake/build/pdfmake' {
  interface TDocumentDefinitions {
    pageSize?: string | [number, number];
    pageMargins?: number | [number, number, number, number];
    header?: (currentPage: number, pageCount: number) => any;
    footer?: (currentPage: number, pageCount: number) => any;
    content?: any;
    defaultStyle?: any;
    [key: string]: any;
  }

  interface PdfMake {
    vfs?: any;
    createPdf(docDefinition: TDocumentDefinitions): {
      getBlob: (callback: (blob: Blob) => void) => void;
      download: (filename?: string) => void;
      open: () => void;
      print: () => void;
    };
  }

  const pdfMake: PdfMake;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: any;
  export default pdfFonts;
}

