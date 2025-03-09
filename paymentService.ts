import Stripe from 'stripe';
import { BookingType } from '@shared/schema';

// Mock payment service when no Stripe key is available
const mockPaymentService = {
  async createPaymentIntent(amount: number, bookingType: BookingType, metadata: any) {
    // Simulate a payment intent creation
    const mockId = `mock_pi_${Date.now()}`;
    return {
      clientSecret: `${mockId}_secret`,
      id: mockId,
    };
  },

  async confirmPayment(paymentIntentId: string) {
    // Always return success for mock payments
    return {
      status: 'succeeded',
      succeeded: true,
    };
  },
};

// If Stripe key is available, use real Stripe service, otherwise use mock
export const paymentService = !process.env.STRIPE_SECRET_KEY
  ? mockPaymentService
  : (() => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia',
        typescript: true,
      });

      return {
        async createPaymentIntent(amount: number, bookingType: BookingType, metadata: any) {
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(amount * 100), // Convert to cents
              currency: 'usd',
              metadata: {
                bookingType,
                ...metadata,
              },
              automatic_payment_methods: {
                enabled: true,
              },
            });

            return {
              clientSecret: paymentIntent.client_secret,
              id: paymentIntent.id,
            };
          } catch (error) {
            console.error('Payment intent creation failed:', error);
            throw new Error('Failed to initialize payment');
          }
        },

        async confirmPayment(paymentIntentId: string) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return {
              status: paymentIntent.status,
              succeeded: paymentIntent.status === 'succeeded',
            };
          } catch (error) {
            console.error('Payment confirmation failed:', error);
            throw new Error('Failed to confirm payment');
          }
        },
      };
    })();