require('dotenv').config();

module.exports = {
	db: {
		host: process.env.DB_HOST,
		name: process.env.DB_NAME,
		user: process.env.DB_USER,
		pass: process.env.DB_PASS
	},
	stripe: {
		secretKey: process.env.STRIPE_SECRET_KEY
	},
	jwt: {
		secret: process.env.JWT_SECRET,
		issuer: process.env.JWT_ISSUER,
		alg: 'HS256'
	},
	smtp: {
		email: process.env.SMTP_EMAIL,
		pass: process.env.SMTP_PASS
	},
	baseUrl: process.env.BASE_URL,
	port: process.env.PORT
}