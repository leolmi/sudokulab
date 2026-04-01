import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';

const TEMP_DIR = path.resolve(process.cwd(), 'temp');

export const saveImage = async (
  img: InstanceType<typeof Jimp>,
  folder: string,
  filename: string
) => {
  const dir = path.join(TEMP_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await img.write(filePath as `${string}.${string}`);
};
