const Subscription = require('../models/Subscription');
const User = require('../models/User');

const PLANS = {
  premium: {
    name: 'Premium',
    amount: 49900, // ₹499 in paise
    currency: 'INR',
    features: ['Unlimited predictions', 'SHAP Explainability', 'What-If Simulator', 'Priority Support'],
  },
  pro: {
    name: 'Pro',
    amount: 99900, // ₹999 in paise
    currency: 'INR',
    features: ['Everything in Premium', 'AI Chat Agent', 'Doctor Consultations', 'Wearable Integration', 'API Access'],
  },
};

// @desc    Get subscription plans
// @route   GET /api/payments/plans
exports.getPlans = async (req, res) => {
  res.json({ plans: PLANS });
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // Demo mode: simulate order creation
      const demoOrderId = 'order_demo_' + Date.now();
      return res.json({
        order: {
          id: demoOrderId,
          amount: plan.amount,
          currency: plan.currency,
        },
        key: 'rzp_test_demo',
        demo: true,
      });
    }

    const Razorpay = require('razorpay');
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `hg_${planId}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: req.user.id,
        planId,
      },
    });

    res.json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: keyId,
      demo: false,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment and activate subscription
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret) {
      // Verify signature
      const crypto = require('crypto');
      const generated = crypto
        .createHmac('sha256', keySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }
    }

    // Create subscription record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = await Subscription.create({
      user: req.user.id,
      plan: planId,
      razorpayOrderId: razorpay_order_id || 'demo_order',
      razorpayPaymentId: razorpay_payment_id || 'demo_payment',
      amount: plan.amount / 100,
      status: 'active',
      startDate,
      endDate,
    });

    // Update user tier
    await User.findByIdAndUpdate(req.user.id, { subscriptionTier: planId });

    res.json({
      success: true,
      subscription: {
        plan: planId,
        startDate,
        endDate,
        amount: plan.amount / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current subscription
// @route   GET /api/payments/subscription
exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
    }).sort({ createdAt: -1 });

    res.json({
      subscription,
      currentTier: req.user.subscriptionTier,
    });
  } catch (error) {
    next(error);
  }
};
