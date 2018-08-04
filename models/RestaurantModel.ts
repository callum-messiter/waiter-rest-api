import { Menu } from './MenuModel';
import { Order } from './OrderModel';
import { TableUser } from './TableUserModel';
import { User } from './UserModel';
import shortId from 'shortId';

/* 
	Best practice: pass object (e.g. owner, menu, order) properties as arguments, instantiate it here; or 
	instantiate it outside, and pass entire object as argument? 
*/
export class Restaurant {
	private generalInfo: GeneralInfo;
	private stripeAccount: object = {}; /* Large object returned by Stripe API */
	private menus: Menu[] = [];
	private orders: Order[] = [];
	private tableUsers: TableUser[] = [];

	constructor(name: string, description: string, location: string, phoneNumber: string, 
		emailAddress: string, registrationDate: Date | number, active: boolean, owner: User) {

		this.generalInfo = new GeneralInfo(
			name, description, location, phoneNumber, emailAddress, registrationDate, active, owner
		);
	}

	set _stripeAccount(stripeAccount: object) {
		this.stripeAccount = stripeAccount;
	}

	public addOrder(order: Order) {
		this.orders.push(order);
	}

	public addTableUser(tableUser: TableUser) {
		this.tableUsers.push(tableUser);
	}	

	public addMenu(menu: Menu) {
		this.menus.push(menu);
	}
}

class GeneralInfo {
	private id: string = shortId.generate();
	private name: string;
	private description: string;
	private location: string; /* Location details need to be reorganised */
	private phoneNumber: string;
	private emailAddress: string;
	private registrationDate: Date | number;
	private active: boolean;
	private owner: User;

	constructor(name: string, description: string, location: string, phoneNumber: string, 
		emailAddress: string, registrationDate: Date | number, active: boolean, owner: User) {

		this.name = name;
		this.description = description;
		this.location = location;
		this.phoneNumber = phoneNumber;
		this.emailAddress = emailAddress;
		this.registrationDate = registrationDate;
		this.active = active;
		this.owner = owner;
	}
}