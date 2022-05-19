/* eslint-disable */

import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51L0YwsLCiKQlQb4oS56q9wDgZhGsqNUeQHaUYTZtIkOTsVIHLPyziJa4Dbki7vxLnQdFgON9cJtcnD7ziU3txMKd00sjHL01xQ'
);

export const bookTour = async (tourID) => {
  try {
    // 1. Have a checkout session created by the server on the server side (server talks to stripe and creates a session)
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourID}`
    );
    console.log(session);

    // 2. Create checkout form + charge credit card}
    await stripe.redirectToCheckout({
      sessionId: session.data.data.session.id,
    });
    console.log('after the payment');
  } catch (err) {
    console.error(err);
    showAlert('error', err);
  }
};
