import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {SUDOKULAB_SESSION_DEVELOP} from '@sudokulab/model';

@Injectable()
export class DevelopGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const devsession = process.env.SUDOKULAB_SESSION === SUDOKULAB_SESSION_DEVELOP;
    return devsession || !environment.production;
  }
}
