import { RectangleDto } from './RectangleDto';

export interface ImgDto {
  readonly data: string;
  readonly rotation: number;
  readonly rect: RectangleDto;
}
