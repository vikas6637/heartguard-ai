// const axios = require('axios');
// const Prediction = require('../models/Prediction');

// const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// // Risk category helper
// const getRiskCategory = (score) => {
//   if (score < 0.3) return 'Low';
//   if (score < 0.5) return 'Moderate';
//   if (score < 0.7) return 'High';
//   return 'Critical';
// };

// // @desc    Run heart disease prediction
// // @route   POST /api/predict
// exports.predict = async (req, res, next) => {
//   try {
//     const metrics = req.body;
//     const required = ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal'];

//     for (const f of required) {
//       if (metrics[f] === undefined || metrics[f] === null) {
//         return res.status(400).json({ error: `Missing field: ${f}` });
//       }
//     }


// //old one to be kept if nothing works




//     // Call ML microservice
// //     const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, metrics, { timeout: 10000 });
// //     const { probability, has_disease, feature_importance, shap_values } = mlResponse.data;

// //     const riskCategory = getRiskCategory(probability);

// //     // Save prediction to DB
// //     const prediction = await Prediction.create({
// //       user: req.user.id,
// //       healthMetrics: {
// //         age: Number(metrics.age),
// //         sex: Number(metrics.sex),
// //         cp: Number(metrics.cp),
// //         trestbps: Number(metrics.trestbps),
// //         chol: Number(metrics.chol),
// //         fbs: Number(metrics.fbs),
// //         restecg: Number(metrics.restecg),
// //         thalach: Number(metrics.thalach),
// //         exang: Number(metrics.exang),
// //         oldpeak: Number(metrics.oldpeak),
// //         slope: Number(metrics.slope),
// //         ca: Number(metrics.ca),
// //         thal: Number(metrics.thal),
// //       },
// //       riskScore: probability,
// //       riskCategory,
// //       featureImportance: feature_importance || {},
// //       shapValues: shap_values || {},
// //       source: 'form',
// //     });

// //     res.status(201).json({
// //       predictionId: prediction._id,
// //       riskScore: probability,
// //       riskCategory,
// //       hasDiseaseRisk: has_disease,
// //       featureImportance: feature_importance || {},
// //     });
// //   } catch (error) {
// //     if (error.code === 'ECONNREFUSED') {
// //       return res.status(503).json({ error: 'ML service unavailable. Please try again later.' });
// //     }
// //     next(error);
// //   }
// // };

// // // @desc    Get prediction history
// // // @route   GET /api/predict/history
// // exports.getHistory = async (req, res, next) => {
// //   try {
// //     const limit = Math.min(parseInt(req.query.limit) || 50, 200);
// //     const query = req.user.role === 'doctor' ? {} : { user: req.user.id };

// //     const predictions = await Prediction.find(query)
// //       .populate('user', 'name email')
// //       .sort({ createdAt: -1 })
// //       .limit(limit);

// //     res.json({ predictions });
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // // @desc    Get single prediction with XAI data
// // // @route   GET /api/predict/:id
// // exports.getPrediction = async (req, res, next) => {
// //   try {
// //     const prediction = await Prediction.findById(req.params.id).populate('user', 'name email');

// //     if (!prediction) {
// //       return res.status(404).json({ error: 'Prediction not found' });
// //     }

// //     // Patients can only see their own
// //     if (req.user.role !== 'doctor' && prediction.user._id.toString() !== req.user.id) {
// //       return res.status(403).json({ error: 'Not authorized' });
// //     }

// //     res.json({ prediction });
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // // @desc    What-if simulator
// // // @route   POST /api/predict/simulate
// // exports.simulate = async (req, res, next) => {
// //   try {
// //     const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, req.body, { timeout: 10000 });
// //     const { probability, has_disease } = mlResponse.data;

// //     res.json({
// //       riskScore: probability,
// //       riskCategory: getRiskCategory(probability),
// //       hasDiseaseRisk: has_disease,
// //     });
// //   } catch (error) {
// //     if (error.code === 'ECONNREFUSED') {
// //       return res.status(503).json({ error: 'ML service unavailable' });
// //     }
// //     next(error);
// //   }
// // };


// //old one ends here when nothing works to be stored back till here from the start

// //new one trial of chat gpt 

// // exports.predict = async (req, res, next) => {
// //   try {
// //     const metrics = req.body;

// //     let mlResponse;

// //     // Retry up to 3 times if ML service gives 429
// //     for (let i = 0; i < 3; i++) {
// //       try {
// //         mlResponse = await axios.post(
// //           `${ML_SERVICE_URL}/predict`,
// //           metrics,
// //           { timeout: 10000 }
// //         );
// //         break;
// //       } catch (error) {
// //         if (error.response?.status === 429 && i < 2) {
// //           console.log(`Retry ${i + 1}: ML service rate limited`);
// //           await new Promise(resolve => setTimeout(resolve, 3000));
// //         } else {
// //           throw error;
// //         }
// //       }
// //     }

// //     if (!mlResponse) {
// //       return res.status(503).json({
// //         error: "Prediction service temporarily unavailable"
// //       });
// //     }

// //     const {
// //       probability,
// //       has_disease,
// //       feature_importance,
// //       shap_values
// //     } = mlResponse.data;

// //     const riskCategory = getRiskCategory(probability);

// //     // Save prediction to DB
// //     const prediction = await Prediction.create({
// //       user: req.user.id,
// //       healthMetrics: {
// //         age: Number(metrics.age),
// //         sex: Number(metrics.sex),
// //         cp: Number(metrics.cp),
// //         trestbps: Number(metrics.trestbps),
// //         chol: Number(metrics.chol),
// //         fbs: Number(metrics.fbs),
// //         restecg: Number(metrics.restecg),
// //         thalach: Number(metrics.thalach),
// //         exang: Number(metrics.exang),
// //         oldpeak: Number(metrics.oldpeak),
// //         slope: Number(metrics.slope),
// //         ca: Number(metrics.ca),
// //         thal: Number(metrics.thal),
// //       },
// //       riskScore: probability,
// //       riskCategory,
// //       featureImportance: feature_importance || {},
// //       shapValues: shap_values || {},
// //       source: "form",
// //     });

// //     res.status(201).json({
// //       predictionId: prediction._id,
// //       riskScore: probability,
// //       riskCategory,
// //       hasDiseaseRisk: has_disease,
// //       featureImportance: feature_importance || {},
// //     });



// // exports.predict = async (req, res, next) => {
// //   try {
// //     const metrics = req.body;

// //     let mlResponse;

// //     // Retry up to 3 times if ML service gives 429
// //     for (let i = 0; i < 3; i++) {
// //       try {
// //         mlResponse = await axios.post(
// //           `${ML_SERVICE_URL}/predict`,
// //           metrics,
// //           { timeout: 10000 }
// //         );
// //         break;
// //       } catch (error) {
// //         if (error.response?.status === 429 && i < 2) {
// //           console.log(`Retry ${i + 1}: ML service rate limited`);
// //           await new Promise(resolve => setTimeout(resolve, 3000));
// //         } else {
// //           throw error;
// //         }
// //       }
// //     }

// //     if (!mlResponse) {
// //       return res.status(503).json({
// //         error: "Prediction service temporarily unavailable"
// //       });
// //     }

// //     const {
// //       probability,
// //       has_disease,
// //       feature_importance,
// //       shap_values
// //     } = mlResponse.data;

// //     const riskCategory = getRiskCategory(probability);

// //     // Save prediction to DB
// //     const prediction = await Prediction.create({
// //       user: req.user.id,
// //       healthMetrics: {
// //         age: Number(metrics.age),
// //         sex: Number(metrics.sex),
// //         cp: Number(metrics.cp),
// //         trestbps: Number(metrics.trestbps),
// //         chol: Number(metrics.chol),
// //         fbs: Number(metrics.fbs),
// //         restecg: Number(metrics.restecg),
// //         thalach: Number(metrics.thalach),
// //         exang: Number(metrics.exang),
// //         oldpeak: Number(metrics.oldpeak),
// //         slope: Number(metrics.slope),
// //         ca: Number(metrics.ca),
// //         thal: Number(metrics.thal),
// //       },
// //       riskScore: probability,
// //       riskCategory,
// //       featureImportance: feature_importance || {},
// //       shapValues: shap_values || {},
// //       source: "form",
// //     });

// //     res.status(201).json({
// //       predictionId: prediction._id,
// //       riskScore: probability,
// //       riskCategory,
// //       hasDiseaseRisk: has_disease,
// //       featureImportance: feature_importance || {},
// //     });

// //   } catch (error) {
// //     console.log("ML ERROR:", error.response?.data || error.message);

// //     if (error.code === "ECONNREFUSED") {
// //       return res.status(503).json({
// //         error: "ML service unavailable. Please try again later."
// //       });
// //     }

// //     if (error.response?.status === 429) {
// //       return res.status(429).json({
// //         error: "Too many requests. Please wait a few seconds and retry."
// //       });
// //     }

// //     return res.status(500).json({
// //       error: "Prediction failed"
// //     });
// //   }
// // };

// // trial ends here 













// // @desc    Delete a prediction
// // @route   DELETE /api/predict/:id
// exports.deletePrediction = async (req, res, next) => {
//   try {
//     const prediction = await Prediction.findById(req.params.id);
//     if (!prediction) {
//       return res.status(404).json({ error: 'Prediction not found' });
//     }
//     if (req.user.role !== 'doctor' && prediction.user.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Not authorized' });
//     }
//     await prediction.deleteOne();
//     res.json({ message: 'Prediction deleted' });
//   } catch (error) {
//     next(error);
//   }
// };
















// // @desc    Delete a prediction
// // @route   DELETE /api/predict/:id
// exports.deletePrediction = async (req, res, next) => {
//   try {
//     const prediction = await Prediction.findById(req.params.id);
//     if (!prediction) {
//       return res.status(404).json({ error: 'Prediction not found' });
//     }
//     if (req.user.role !== 'doctor' && prediction.user.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Not authorized' });
//     }
//     await prediction.deleteOne();
//     res.json({ message: 'Prediction deleted' });
//   } catch (error) {
//     next(error);
//   }
// };















const axios = require('axios');
const Prediction = require('../models/Prediction');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Risk category helper
const getRiskCategory = (score) => {
  if (score < 0.3) return 'Low';
  if (score < 0.5) return 'Moderate';
  if (score < 0.7) return 'High';
  return 'Critical';
};

// @desc    Run heart disease prediction
// @route   POST /api/predict
exports.predict = async (req, res, next) => {
  try {
    const metrics = req.body;

    const required = [
      'age','sex','cp','trestbps','chol','fbs',
      'restecg','thalach','exang','oldpeak',
      'slope','ca','thal'
    ];

    for (const f of required) {
      if (metrics[f] === undefined || metrics[f] === null) {
        return res.status(400).json({ error: `Missing field: ${f}` });
      }
    }

    let mlResponse;

    // Retry up to 3 times if ML service gives 429
    for (let i = 0; i < 3; i++) {
      try {
        mlResponse = await axios.post(
          `${ML_SERVICE_URL}/predict`,
          metrics,
          { timeout: 10000 }
        );
        break;
      } catch (error) {
        if (error.response?.status === 429 && i < 2) {
          console.log(`Retry ${i + 1}: ML service rate limited`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw error;
        }
      }
    }

    if (!mlResponse) {
      return res.status(503).json({
        error: "Prediction service temporarily unavailable"
      });
    }

    const {
      probability,
      has_disease,
      feature_importance,
      shap_values
    } = mlResponse.data;

    const riskCategory = getRiskCategory(probability);

    const prediction = await Prediction.create({
      user: req.user.id,
      healthMetrics: {
        age: Number(metrics.age),
        sex: Number(metrics.sex),
        cp: Number(metrics.cp),
        trestbps: Number(metrics.trestbps),
        chol: Number(metrics.chol),
        fbs: Number(metrics.fbs),
        restecg: Number(metrics.restecg),
        thalach: Number(metrics.thalach),
        exang: Number(metrics.exang),
        oldpeak: Number(metrics.oldpeak),
        slope: Number(metrics.slope),
        ca: Number(metrics.ca),
        thal: Number(metrics.thal),
      },
      riskScore: probability,
      riskCategory,
      featureImportance: feature_importance || {},
      shapValues: shap_values || {},
      source: "form",
    });

    res.status(201).json({
      predictionId: prediction._id,
      riskScore: probability,
      riskCategory,
      hasDiseaseRisk: has_disease,
      featureImportance: feature_importance || {},
    });

  } catch (error) {
    console.log("ML ERROR:", error.response?.data || error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "ML service unavailable. Please try again later."
      });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "ML service timeout. Please retry."
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: "Too many requests. Please wait a few seconds and retry."
      });
    }

    return res.status(500).json({
      error: "Prediction failed"
    });
  }
};

// @desc    Get prediction history
// @route   GET /api/predict/history
exports.getHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const query = req.user.role === 'doctor' ? {} : { user: req.user.id };

    const predictions = await Prediction.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ predictions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prediction
// @route   GET /api/predict/:id
exports.getPrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('user', 'name email');

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (req.user.role !== 'doctor' && prediction.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ prediction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prediction
// @route   DELETE /api/predict/:id
exports.deletePrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (req.user.role !== 'doctor' && prediction.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prediction.deleteOne();

    res.json({ message: 'Prediction deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    What-if simulator
// @route   POST /api/predict/simulate
exports.simulate = async (req, res, next) => {
  try {
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, req.body, {
      timeout: 10000
    });

    const { probability, has_disease } = mlResponse.data;

    res.json({
      riskScore: probability,
      riskCategory: getRiskCategory(probability),
      hasDiseaseRisk: has_disease,
    });

  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "ML service unavailable" });
    }

    next(error);
  }
};