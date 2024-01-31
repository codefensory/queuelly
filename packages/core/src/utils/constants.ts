export enum QueuellyState {
  None = 1,
  Block = 1 << 1,
  Pending = 1 << 2,
  Complete = 1 << 3,
  Error = 1 << 4,
  Canceled = 1 << 5,
  PartialComplete = 1 << 6,
}
