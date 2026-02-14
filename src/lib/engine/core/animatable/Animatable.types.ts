import type { ComponentDataType } from "../componentRegistry";

export interface IAnimatable {
  id: string;
  name: string;
  components: ComponentDataType[];
}