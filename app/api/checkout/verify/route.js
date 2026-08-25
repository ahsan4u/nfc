import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOrderEmails } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_details } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Missing payment verification parameters' }, { status: 400 });
    }

    const privateKey = process.env.RAZERPAY_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', privateKey)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
    }

    // Trigger emails for verified online order
    if (order_details) {
      sendOrderEmails({
        order_id: razorpay_order_id,
        amount: order_details.amount,
        customer: order_details.customer,
        items: order_details.items,
        payment_method: 'razorpay',
      }).catch(err => console.error("Async online email dispatch error:", err));
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Verification failed' }, { status: 500 });
  }
}
