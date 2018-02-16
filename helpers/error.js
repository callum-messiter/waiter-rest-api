// Default error message for client to render to user
const defaultUserMsg = 'Oops! The waiter system experienced an error - please try again. If the issue persists, contact our support team.';

// Error messages
module.exports = {
	emailNotRegistered: {
		errorKey: 'email_not_registered',
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	passwordIncorrect: {
		errorKey: 'password_incorrect',
		userMsg: 'The username and password you entered did not match our records. Please double-check and try again.'
	},
	userNotActive: {
		errorKey: 'user_not_active',
		userMsg: 'This account is not currently active. You can restore your account by clicking here.'
	},
	restaurantNotFound: {
		errorKey: 'restaurant_not_found',
		userMsg: defaultUserMsg
	},
	menuNotFound: {
		errorKey: 'menu_not_found',
		userMsg: defaultUserMsg
	}
}

// Errors
