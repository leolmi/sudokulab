import { Injectable } from "@nestjs/common";
import { Message, Schema } from "@sudokulab/api-interfaces";
import * as schemas from "../assets/schemas.json";

@Injectable()
export class AppService {
  getData(): Message {
    return { message: "Welcome to api!" };
  }

  getSchemas(): Schema[] {
    return schemas.schemas;
  }
}
