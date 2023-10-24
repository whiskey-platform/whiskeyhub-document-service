export interface _Object {
  Key?: string;
  LastModified?: Date;
  ETag?: string;
  Size?: number;
}
export interface CommonPrefix {
  Prefix?: string;
}
export declare enum EncodingType {
  url = 'url',
}
export interface ListObjectsV2Output {
  IsTruncated?: boolean;
  Contents?: _Object[];
  Name?: string;
  Prefix?: string;
  Delimiter?: string;
  MaxKeys?: number;
  CommonPrefixes?: CommonPrefix[];
  EncodingType?: EncodingType | string;
  KeyCount?: number;
  ContinuationToken?: string;
  NextContinuationToken?: string;
  StartAfter?: string;
}
