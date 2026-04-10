export declare class CreateMenuDto {
    parentId?: string;
    subsystemId?: string;
    name: string;
    code: string;
    path?: string;
    component?: string;
    redirect?: string;
    icon?: string;
    sortOrder?: number;
    type?: string;
    permission?: string;
    isVisible?: boolean;
    isCache?: boolean;
    isFrame?: boolean;
}
