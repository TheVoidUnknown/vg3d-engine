import type { IComponentType } from "../component/Component.types";

export interface IAnimatable {
  id: string;
  name: string;
  components: IComponentType[];
}