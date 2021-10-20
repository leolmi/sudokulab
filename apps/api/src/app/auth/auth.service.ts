import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {

  googleLogin(req) {
    console.log('AUTH REQUEST', req);
    return req.user ? { user: req.user } : {}
  }
}
