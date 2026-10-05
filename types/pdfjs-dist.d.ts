// types/pdfjs-dist.d.ts
// pdfjs-dist no tipa el import del worker (es un .mjs dentro de build/).
declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
    const workerUrl: string;
    export default workerUrl;
}