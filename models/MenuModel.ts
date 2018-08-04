import { Category } from './CategoryModel';
import { Item } from './ItemModel';

export class Menu {
	private id: string = shortId.generate();
	private restaurantId: string;
	private name: string;
	private description: string;
	private categories: Category[] = [];
	private active: boolean;
	private date: Date | number;

	constructor(restaurantId: string, name: string, description: string, active: boolean, date: Date | number) {
		this.restaurantId = restaurantId;
		this.name = name;
		this.description = description;
		this.active = active;
		this.date = date;
	}

	public addCategory(category: Category) {
		this.categories.push(category);
	}
}