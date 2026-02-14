import { COMPONENTS } from "../../registry/RegisterComponents";

export type ComponentConstructorType = (typeof COMPONENTS)[number];
export type ComponentInstanceType = InstanceType<ComponentConstructorType>;
export type ComponentDataType = ReturnType<ComponentInstanceType['serialize']>;
export type ComponentNameType = ComponentConstructorType['TYPE'];

// Helper types
export type GetConstructor<T extends ComponentNameType> = Extract<ComponentConstructorType, { TYPE: T }>;
export type GetData<T extends ComponentNameType> = Extract<ComponentDataType, { type: T }>;
export type GetInstance<T extends ComponentNameType> = InstanceType<GetConstructor<T>>;