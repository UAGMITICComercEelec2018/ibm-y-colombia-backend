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



	console.log("ev.queryStringParameters: ", ev.queryStringParameters);
	console.log("ev.pathParameters: ", ev.pathParameters);

	const items = [
		{
			id: ev.pathParameters.itemID,
			description: ev.queryStringParameters.desc,
			info: {
				name: ev.queryStringParameters.name,
				sku: ev.queryStringParameters.sku,
				price: ev.queryStringParameters.price,
				currency: ev.queryStringParameters.currency,
				quantity: 1
			},
			price: {
				currency: ev.queryStringParameters.currency,
				total: ev.queryStringParameters.price
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
			paypal.payment.create(create_payment_json, function (error, payment) {
				if (error) {
					reject(error);
				} else {
					console.log("Create Payment Response");
					resolve(payment);
				}
			})
		);
		console.log("payment: ", payment);

		var test: any = payment

		return callback(null, redirect(test.links[1].href))
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

		return callback(null, redirect(process.env.PURCHASE_SUCCESS_URL));
	}
	catch (error) {
		console.log("error: ", error);
		return callback(null, redirect(process.env.PURCHASE_ERROR_URL));
	}

}

export async function onPayPalPurchaseSNS(ev, context, callback) {
	console.log(ev);
	return callback(null, success({ ev }));
}
