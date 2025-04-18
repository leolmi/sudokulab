export interface UserValue {
  text?: string;
  userValues?: string[];
}

export interface ValueOptions {
  allowDynamic?: boolean;
  allowUserValue?: boolean;
  emptyValue?: string;
  onlyValues?: boolean;
  schemaMode?: boolean;
  userValues?: string;
}
