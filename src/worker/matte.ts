// Per-frame BiRefNet-lite inference: RGBA frame -> same-size RGBA with
// the model's alpha matte applied (constrained by the original alpha).

import * as ort from 'onnxruntime-web/webgpu';
import type { LoadedModel } from './model';
import { flattenFrame, applyMatte } from './compose';

const SIZE = 512;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Reused scratch canvases.
const inCanvas = new OffscreenCanvas(SIZE, SIZE);
const inCtx = inCanvas.getContext('2d', { willReadFrequently: true })!;
const maskCanvas = new OffscreenCanvas(SIZE, SIZE);
const maskCtx = maskCanvas.getContext('2d')!;
const alphaCanvas = new OffscreenCanvas(1, 1);
const alphaCtx = alphaCanvas.getContext('2d', { willReadFrequently: true })!;
const frameCanvas = new OffscreenCanvas(1, 1);
const frameCtx = frameCanvas.getContext('2d')!;

function preprocess(frame: ImageData): ort.Tensor {
  // Model input must be fully opaque: flatten the frame onto white so
  // transparent regions read as (255,255,255) background instead of the
  // (0,0,0) "transparent black" that collides with dark outlines/foreground.
  const flat = flattenFrame(frame);
  frameCanvas.width = flat.width;
  frameCanvas.height = flat.height;
  frameCtx.putImageData(flat, 0, 0);
  // Belt-and-suspenders: fill white before drawImage so any residual
  // transparency lands on opaque white too.
  inCtx.fillStyle = '#ffffff';
  inCtx.fillRect(0, 0, SIZE, SIZE);
  inCtx.drawImage(frameCanvas, 0, 0, SIZE, SIZE);
  const { data } = inCtx.getImageData(0, 0, SIZE, SIZE);

  const px = SIZE * SIZE;
  const input = new Float32Array(3 * px);
  for (let i = 0; i < px; i++) {
    input[i] = (data[i * 4] / 255 - MEAN[0]) / STD[0];
    input[px + i] = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1];
    input[2 * px + i] = (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2];
  }
  return new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]);
}

function sigmoidToAlphaMask(logits: Float32Array): ImageData {
  const px = SIZE * SIZE;
  const mask = new ImageData(SIZE, SIZE);
  for (let i = 0; i < px; i++) {
    const a = Math.round((1 / (1 + Math.exp(-logits[i]))) * 255);
    mask.data[i * 4] = a;
    mask.data[i * 4 + 1] = a;
    mask.data[i * 4 + 2] = a;
    mask.data[i * 4 + 3] = 255;
  }
  return mask;
}

/** Runs the matting model on one frame; returns a new ImageData with alpha applied. */
export async function matteFrame(model: LoadedModel, frame: ImageData): Promise<ImageData> {
  const { session } = model;
  const inputName = session.inputNames[0];
  const tensor = preprocess(frame);
  const results = await session.run({ [inputName]: tensor });
  const logits = results[session.outputNames[0]].data as Float32Array;

  // Resize the 512x512 matte back to the frame size.
  maskCtx.putImageData(sigmoidToAlphaMask(logits), 0, 0);
  alphaCanvas.width = frame.width;
  alphaCanvas.height = frame.height;
  alphaCtx.clearRect(0, 0, frame.width, frame.height);
  alphaCtx.drawImage(maskCanvas, 0, 0, frame.width, frame.height);
  const alpha = alphaCtx.getImageData(0, 0, frame.width, frame.height);

  // final_a = model_a * original_a, original RGB preserved, low-alpha zeroed.
  return applyMatte(frame, alpha);
}
