const tierLimits = {
  free: {
    predictionsPerMonth: 5,
    chatMessagesPerDay: 3,
    features: ['basic_prediction'],
  },
  premium: {
    predictionsPerMonth: -1, // unlimited
    chatMessagesPerDay: -1,
    features: ['basic_prediction', 'xai_dashboard', 'simulator', 'reports'],
  },
  pro: {
    predictionsPerMonth: -1,
    chatMessagesPerDay: -1,
    features: ['basic_prediction', 'xai_dashboard', 'simulator', 'reports', 'appointments', 'wearable_sync'],
  },
};

const requireTier = (...requiredTiers) => {
  return (req, res, next) => {
    const userTier = req.user.subscriptionTier || 'free';
    if (!requiredTiers.includes(userTier)) {
      return res.status(403).json({
        error: 'Upgrade required',
        message: `This feature requires ${requiredTiers.join(' or ')} plan`,
        currentTier: userTier,
      });
    }
    next();
  };
};

const requireFeature = (feature) => {
  return (req, res, next) => {
    const userTier = req.user.subscriptionTier || 'free';
    const allowed = tierLimits[userTier]?.features || [];
    if (!allowed.includes(feature)) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `'${feature}' requires a plan upgrade`,
        currentTier: userTier,
      });
    }
    next();
  };
};

module.exports = { tierLimits, requireTier, requireFeature };
