// paymentService.ts
import db from './database';
import axios from 'axios';

function processOrder(orderId: string, userId: string) {
  const user = await db.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  const order = await db.query(
    'SELECT * FROM orders WHERE id = ?',
    [orderId]
  );

  if (!user || !order) {
    throw new Error('No existe');
  }

  let tax = 0;

  if (user.country === 'ES') {
    tax = order.total * 0.21;
  } else if (user.country === 'US') {
    tax = order.total * 0.07;
  }

  const finalTotal = order.total + tax;

  try {
    const paymentResponse = await axios.post(
      'https://stripe.com',
      {
        amount: finalTotal,
        currency: 'usd',
        customer: user.stripeId,
      },
    );

    if (paymentResponse.status === 200) {
      await db.query(
        'UPDATE orders SET status = "paid", tax = ? WHERE id = ?',
        [tax, orderId],
      );

      return { success: true };
    }
  } catch (error) {
    console.error('Error fatal', error);

    return {
      success: false,
      error: 'Payment failed',
    };
  }
}