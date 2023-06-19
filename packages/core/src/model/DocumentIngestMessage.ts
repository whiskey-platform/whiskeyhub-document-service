export interface DocumentIngestMessage {
  sourceBucket: string;
  sourceKey: string;
  destinationKey: string;
}
