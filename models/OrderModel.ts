import { Item } from './ItemModel';
import shortId from 'shortId';

export class Order {
	public id: string = shortId.generate();
	public price: number;
	public status: number;
	public timePlaced: number;
	public diner: User;
	public restaurant: RecipientRestaurant;
	public items: Item[] = [];

	constructor(id: string, price: number, status: number, timePlaced: number) {
		this.id = id;
		this.price = price;
		this.timePlaced = timePlaced;

		/* Check that the status is valid */
		let statusValid = false;
		Object.keys(OrderStatus).forEach(key => {
			if(status === OrderStatus[key]) {
				statusValid = true;
			}
		});
		if(!statusValid) throw new Error(`Order status ${status} not allowed.`);
		
		this.status = status;
	}

	set _diner(diner: User) {
		this.diner = diner;
	}

	set _restaurant(restaurant: RecipientRestaurant) {
		this.restaurant = restaurant;
	}

	addItem(name: string, price: number, description: string, date: Date | number, active: boolean) {
		const item = new Item(name, price, description);
		this.items.push(item);
	}
}

export class RecipientRestaurant {
	private id: string = shortId.generate();;
	private name: string;
	private tableNumber: string;

	constructor(name: string, tableNumber: string) {
		this.name = name;
		this.tableNumber = tableNumber;
	}
}

export enum OrderStatus {
	sentToServer = 50,
	receivedByServer = 100,
	sentToKitchen = 200,
	receivedByKitchen = 300,
	rejectedByKitchen = 999,
	acceptedByKitchen = 400,
	paymentFailed = 998,
	paymentSuccessful = 500,
	enRouteToCustomer = 1000,
	refunded = 600
}