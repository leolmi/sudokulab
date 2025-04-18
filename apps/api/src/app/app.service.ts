import { Injectable } from '@nestjs/common';
import { SUDOKULAB_AUTHOR, SUDOKULAB_SESSION_STANDARD, SUDOKULAB_TITLE, SudokulabInfo, VERSION } from '@olmi/model';


@Injectable()
export class AppService {

  getData(): SudokulabInfo {
    return new SudokulabInfo({
      version: VERSION,
      author: process.env.SUDOKULAB_AUTHOR || SUDOKULAB_AUTHOR,
      title: process.env.SUDOKULAB_TITLE || SUDOKULAB_TITLE,
      session: process.env.SUDOKULAB_SESSION || SUDOKULAB_SESSION_STANDARD
    });
  }
}
