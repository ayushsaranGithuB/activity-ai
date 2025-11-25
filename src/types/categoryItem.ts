export interface CategoryItem {
    id: number;
    name: string;
    description?: string;
    icon?: string;
}

export type PartialCategoryItem = Partial<CategoryItem>;
