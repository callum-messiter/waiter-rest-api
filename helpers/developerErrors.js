module.exports = {
	chargeNotFound: 'We store in the DB a reference to the Stripe charge. This error means this reference does not exist in the DB. It could mean that the order has not been paid for, e.g. if the order was rejected by the restaurant. It can also mean that the orderID provided represents a non-existent order.'
	, cannotRefundUnpaidOrder: 'We store in the DB a reference to the charge when the order is placed. We only process the charge via Stripe once the restaurant accepts the order. Between these points, the reference to the charge specifies it as being unpaid. This error likely means the order was rejected by the restaurant.'
	,
}