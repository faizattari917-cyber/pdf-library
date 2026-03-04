import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PdfEntry {
    id: string;
    title: string;
    description: string;
    blobId: string;
    uploadedAt: bigint;
}
export interface backendInterface {
    addPdf(token: string, title: string, description: string, blobId: string): Promise<string>;
    deletePdf(token: string, id: string): Promise<void>;
    getPdf(id: string): Promise<PdfEntry>;
    listPdfs(): Promise<Array<PdfEntry>>;
}
