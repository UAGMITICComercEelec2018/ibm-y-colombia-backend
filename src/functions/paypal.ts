'use strict';
import { success, failure, notAllowed } from './../libs/response-lib';
import * as paypal from 'paypal-rest-sdk';
import { resolve } from "url";

export async function createPayPalCharge(ev, context, callback) {
	console.log(ev);

	paypal.configure({
		'mode': 'sandbox', //sandbox or live
		'client_id': 'AWrPg867dXazYibADcxykNWsP3IJYYr5KXq0J82Q6FBtcHaY_mttPaE6OGDR_WLAYNMZ3YeesnJc1wzU',
		'client_secret': 'EHPhayNQag75jFsSK1aBMPDosQ64a4Y26LJiM8v7_nL7Fa-cOxeg_kWCmDVslXeQ0DGT-S6eKm47NDxr'
	});

	const create_payment_json = JSON.stringify({
		intent: 'sale',
		payer: {
			payment_method: 'paypal'
		},
		redirect_urls: {
			return_url: 'http://return.url',
			cancel_url: 'http://cancel.url'
		},
		transactions: [{
			item_list: {
				items: [{
					name: 'item',
					sku: 'item',
					price: '1.00',
					currency: 'USD',
					quantity: 1
				}]
			},
			amount: {
				currency: 'USD',
				total: '1.00'
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