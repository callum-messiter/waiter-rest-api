export class TableUser {
	private userId: string;
	private restaurantId: string;
	private customerId: string;
	private tableNo: string;
	private time: number;

	constructor(userId: string, restaurantId: string, customerId: string, tableNo: string, time: number) {
		this.userId = userId;
		this.restaurantId = restaurantId;
		this.customerId = customerId;
		this.tableNo = tableNo;
		this.time = time;
	}
}