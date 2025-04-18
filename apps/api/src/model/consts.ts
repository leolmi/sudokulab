import { HttpException, HttpStatus } from '@nestjs/common';

export const DEFAULT_API_PORT = 3333;
export const DEFAULT_REQUEST_LIMIT = '10mb';
export const DEFAULT_CONTEXT = 'api';


export const notImplemented = () => {
  throw new HttpException('not implemented yet', HttpStatus.NOT_IMPLEMENTED);
}

export const badRequest = (message = 'uncorrect request') => {
  throw new HttpException(message, HttpStatus.BAD_REQUEST);
}
