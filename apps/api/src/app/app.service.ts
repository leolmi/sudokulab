import {Injectable} from "@nestjs/common";
import {Message, Schema} from "@sudokulab/api-interfaces";
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: "Welcome to api!" };
  }

  async getSchemas(): Promise<Schema[]> {
    return new Promise((res, rej) => {
      const schemas: Schema[] = [];
      const root = path.resolve(__dirname, `./assets/schemas`);
      fs.readdir(root, (err, files) => {
        if (err) return rej(err);
        files.forEach(file => {
          const sch_str = fs.readFileSync(`${root}/${file}`, {encoding: 'utf8', flag: 'r'});
          try {
            const schema = <Schema>JSON.parse(sch_str);
            if (!!schema) schemas.push(schema);
          } catch (err) {
            console.error('Cannot deserialize schema data!', file);
          }
        });
        res(schemas);
      });
    });
  }
}
