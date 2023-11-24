export type Document = {
  key: string;
  contentType: string;
  size: number;

  created: Date;
  lastModified: Date;

  parentKey: string;
};
