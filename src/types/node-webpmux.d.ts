declare module "node-webpmux" {
  export class Image {
    exif: Buffer;
    load(path: string): Promise<void>;
    save(path: string): Promise<void>;
  }
}
