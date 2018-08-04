import shortId from 'shortid';

export class User {
	private id: string = shortId.generate();
	private firstName: string;
	private lastName: string;
	private email: string;
	private roleId?: number;
	private password?: string;

	constructor(firstName: string, lastName: string, email: string, roleId?: number, password?: string) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		if(roleId) {
			this.roleId = roleId;
		}
		if(password) {
			this.password = password;
		}
	}
}

export interface UserRole {
	userId: string;
	roleId: number;
	startDate: Date;
}

enum Roles {
	diner = 100,
	restaurateur = 200
}