import { MenuItem } from './ItemModel';
import shortId from 'shortId';

export class Category {
	private id: string = shortId.generate();
	private menuId: string;
	private name: string;
	private description: string;
	private active: boolean;
	private items: MenuItem[] = [];
	private date: Date | number;

	constructor(menuId: string, name: string, description: string, active: boolean, date: Date | number) {
		this.menuId = menuId;
		this.name = name;
		this.description = description;
		this.active = active;
		this.date = date;
	}

	public addItem(item: MenuItem) {
		this.items.push(item);
	}
}

