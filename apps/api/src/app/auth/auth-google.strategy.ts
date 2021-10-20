import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { environment } from '../../environments/environment';
import { GoogleCredentials } from '@sudokulab/model';


@Injectable()
export class AuthGoogleStrategy extends PassportStrategy(Strategy, 'google') {

  constructor() {
    super({
      clientID: environment.google.clientID,
      clientSecret: environment.google.clientSecret,
      callbackURL: environment.google.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    if (emails[0].value === environment.google.mail) {
      done(null, <GoogleCredentials>{
        email: emails[0].value,
        name: name.givenName,
        picture: photos[0].value,
        accessToken
      });
    } else {
      done('Not authorized!');
    }
  }
}
