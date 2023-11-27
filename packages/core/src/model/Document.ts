export type Document = {
  key: string;

  filename: string;
  contentType: string;
  size: number;

  created: Date;
  lastModified: Date;

  parentKey: string;
};
