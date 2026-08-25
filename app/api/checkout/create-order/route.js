import { NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, payment_method = 'razorpay' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone || !customer?.email || !customer?.address) {
      return NextResponse.json({ success: false, message: 'Customer details (name, phone, email, address) are required' }, { status: 400 });
    }

    // Calculate total amount in Rupees
    const totalAmount = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
    }

    // If Cash on Delivery (COD)
    if (payment_method === 'cod') {
      const codOrderId = `NFC-COD-${Date.now().toString().slice(-6)}`;

      // Send emails to customer and admin
      sendOrderEmails({
        order_id: codOrderId,
        amount: totalAmount,
        customer,
        items,
        payment_method: 'cod',
      }).catch(err => console.error("Async email dispatch error:", err));

      return NextResponse.json({
        success: true,
        order_id: codOrderId,
        payment_method: 'cod',
        amount: totalAmount,
        currency: 'INR',
        customer,
        items,
        message: 'COD order placed successfully'
      });
    }

    // Razorpay Online Payment
    const publicKey = process.env.RAZERPAY_PUBLIC_KEY;
    const privateKey = process.env.RAZERPAY_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      return NextResponse.json({ success: false, message: 'Razorpay keys not configured on server' }, { status: 500 });
    }

    // Razorpay amount in Paise (multiply by 100)
    const amountInPaise = Math.round(totalAmount * 100);
    const receiptId = `nfc_rcpt_${Date.now().toString().slice(-8)}`;

    const authHeader = `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString('base64')}`;

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_address: customer.address,
        },
      }),
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok || !rzpData.id) {
      throw new Error(rzpData.error?.description || 'Failed to create Razorpay order');
    }

    return NextResponse.json({
      success: true,
      order_id: rzpData.id,
      amount: totalAmount,
      amount_in_paise: rzpData.amount,
      currency: rzpData.currency,
      key_id: publicKey,
      payment_method: 'razorpay',
      customer,
      items,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Order creation failed' }, { status: 500 });
  }
}
