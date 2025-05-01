import { Injectable } from '@nestjs/common';
import { SUDOKULAB_AUTHOR, SUDOKULAB_SESSION_STANDARD, SUDOKULAB_TITLE, SudokulabInfo } from '@olmi/model';
import { version, algorithmsVersion } from '../../../../package.json'

@Injectable()
export class AppService {

  getData(): SudokulabInfo {
    return new SudokulabInfo({
      version,
      algorithmsVersion,
      author: process.env.SUDOKULAB_AUTHOR || SUDOKULAB_AUTHOR,
      title: process.env.SUDOKULAB_TITLE || SUDOKULAB_TITLE,
      session: process.env.SUDOKULAB_SESSION || SUDOKULAB_SESSION_STANDARD
    });
  }
}
