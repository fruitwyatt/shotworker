// Minimal typings for upng-js (only the encode entry point we use).
declare module 'upng-js' {
  interface UpngImage {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    frames: unknown[];
    data: ArrayBuffer;
  }
  const UPNG: {
    encode(
      imgs: ArrayBuffer[],
      w: number,
      h: number,
      cnum: number,
      delys?: number[],
    ): ArrayBuffer;
    decode(buf: ArrayBuffer): UpngImage;
    toRGBA8(img: UpngImage): ArrayBuffer[];
  };
  export default UPNG;
}
