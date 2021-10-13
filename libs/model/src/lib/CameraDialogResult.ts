export class CameraDialogResult {
  constructor(r?: Partial<CameraDialogResult>) {
    this.onlyValues = false;
    Object.assign(this, r || {});
  }
  image?: string;
  onlyValues: boolean;
}
