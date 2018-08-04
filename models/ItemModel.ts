import shortId from 'shortId';

export class Item {
	private id: string = shortId.generate();
	private name: string;
	private price: number;
	private description: string;

	constructor(name: string, price: number, description: string) {
		this.name = name;
		this.price = price;
		this.description = description;
	}
}

export class MenuItem extends Item {
	private active: boolean;
	private date: Date | number;

	constructor(name: string, price: number, description: string, date: Date | number, active: boolean) {
		super(name, price, description);
		this.active = active;
		this.date = date;
	}
}