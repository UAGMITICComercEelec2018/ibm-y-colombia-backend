'use strict';
import { success, failure, notAllowed, redirect } from './../libs/response-lib';
import * as paypal from 'paypal-rest-sdk';
import { resolve } from "url";

export async function createPayPalCharge(ev, context, callback) {
	console.log(ev);

	paypal.configure({
		'mode': 'sandbox', //sandbox or live
		'client_id': process.env.PAYPAL_CLIENT_ID,
		'client_secret': process.env.PAYPAL_CLIENT_SECRET
	});

	const items = [
		{
			id: 'item1',
			description: 'item1',
			info: {
				name: 'item',
				sku: 'item',
				price: '100.00',
				currency: 'USD',
				quantity: 1
			},
			price: {
				currency: 'USD',
				total: '100.00'
			}
		},
		{
			id: 'item2',
			description: 'item2',
			info: {
				name: 'item2',
				sku: 'item2',
				price: '200.00',
				currency: 'USD',
				quantity: 1
			},
			price: {
				currency: 'USD',
				total: '200.00'
			}
		}
	];

	const { itemID } = ev.pathParameters;
	const item = items.find(i => i.id == itemID);

	if (!item) {
		return callback(null, failure({ error: 'Item no econtrado' }));
	}

	const create_payment_json = JSON.stringify({
		intent: 'sale',
		payer: {
			payment_method: 'paypal'
		},
		redirect_urls: {
			return_url: process.env.PAYPAL_SERVICE_RETURN_URL,
			cancel_url: process.env.PAYPAL_SERVICE_ERROR_URL
		},
		transactions: [{
			item_list: {
				items: [item.info]
			},
			amount: {
				...item.price
			},
			description: 'This is the payment description.'
		}]
	});

	try {
		const payment = await new Promise((resolve, reject) =>
			paypal.payment.create(create_payment_json, function(error, payment) {
				if (error) {
					reject(error);
				} else {
					console.log("Create Payment Response");
					resolve(payment);
				}
			})
		);
		return callback(null, success(payment))
	} catch (error) {
		console.log("error: ", error);
		return callback(null, failure(error))
	}
}

export async function handlerPayPalResult(ev, context, callback) {
	console.log("ev: ", ev);

	try {
		const { successOrError } = ev.pathParameters;
		const { paymentId, PayerID: payer_id } = ev.queryStringParameters;

		if ('success' !== successOrError) {
			throw ev;
		}

		const payment = await new Promise((resolve, reject) =>
			paypal.payment.execute(paymentId, { payer_id }, (error, payment) => {
				if (error) {
					reject(error);
				}
				resolve(payment);
			})
		);

		console.log(payment);

		return callback(null, redirect(process.env.PAYPAL_PURCHASE_SUCCESS_URL));
	}
	catch (error) {
		console.log("error: ", error);
		return callback(null, redirect(process.env.PAYPAL_PURCHASE_ERROR_URL));
	}

}

export async function onPayPalPurchaseSNS(ev, context, callback) {
	console.log(ev);
	return callback(null, success({ ev }));
}
