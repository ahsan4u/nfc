import { NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, delivery_charge = 0, payment_method = 'razorpay' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    if (!customer?.name || !customer?.phone || !customer?.email) {
      return NextResponse.json({ success: false, message: 'Customer details (name, phone, email) are required' }, { status: 400 });
    }

    // Calculate items total amount in Rupees
    const itemsTotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);

    const deliveryFee = Math.max(0, parseFloat(delivery_charge) || 0);
    const finalTotal = itemsTotal + deliveryFee;

    if (finalTotal <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid order total' }, { status: 400 });
    }

    // If Cash on Delivery (COD)
    if (payment_method === 'cod') {
      const codOrderId = `TNS-COD-${Date.now().toString().slice(-6)}`;

      // Send emails to customer and admin
      try {
        await sendOrderEmails({
          order_id: codOrderId,
          amount: finalTotal,
          delivery_charge: deliveryFee,
          customer,
          items,
          payment_method: 'cod',
        });
      } catch (err) {
        console.error("Async email dispatch error:", err);
      }

      return NextResponse.json({
        success: true,
        order_id: codOrderId,
        payment_method: 'cod',
        amount: finalTotal,
        delivery_charge: deliveryFee,
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
    const amountInPaise = Math.round(finalTotal * 100);
    const receiptId = `tns_rcpt_${Date.now().toString().slice(-8)}`;

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
          customer_location: customer.selected_location || 'N/A',
          customer_landmark: customer.landmark || 'N/A',
          customer_address: customer.address || 'N/A',
          delivery_charge: deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE',
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
