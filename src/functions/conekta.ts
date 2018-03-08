"use strict";
import { success, failure, notAllowed } from "./../libs/response-lib";
import * as conekta from "conekta";
import { resolve } from "url";
conekta.api_key = process.env.CONEKTA_API_KEY;
conekta.api_version = "2.0.0";

export async function createOxxoCharge(event, context, callback) {
  console.log(conekta);
  const { Card } = conekta;
  try {
    const order = await new Promise((resolve, reject) =>
      conekta.Order.create(
        {
          line_items: [
            {
              name: "Tacos",
              unit_price: 1000,
              quantity: 12
            }
          ],
          shipping_lines: [
            {
              amount: 1500,
              carrier: "FEDEX"
            }
          ], //shipping_lines - phyiscal goods only
          currency: "MXN",
          customer_info: {
            name: "Fulanito Pérez",
            email: "fulanito@conekta.com",
            phone: "+5218181818181"
          },
          shipping_contact: {
            address: {
              street1: "Calle 123, int 2",
              postal_code: "06100",
              country: "MX"
            }
          }, //shipping_contact - required only for physical goods
          charges: [
            {
              payment_method: {
                type: "oxxo_cash"
              }
            }
          ]
        },
        (err, res) => {
          if (err) return reject(err);
          resolve(res.toObject());
        }
      )
    );
    return callback(null, success("EXITOOOOOOOO"));
    // console.log(order);
  } catch (error) {
    // console.log(error);
  }
  //console.log(conekta);
}
