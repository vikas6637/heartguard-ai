const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Try multiple models in case one is rate-limited
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const SYSTEM_PROMPT = `You are HeartGuard AI, a compassionate and knowledgeable cardiac health assistant.

Your capabilities:
1. SYMPTOM MAPPING: When users describe symptoms conversationally (e.g., "I feel out of breath"), map them to clinical parameters (chest pain type, exercise angina, etc.)
2. HEALTH EDUCATION: Explain cardiac risk factors in simple language
3. LIFESTYLE ADVICE: Provide personalized diet, exercise, and lifestyle recommendations based on risk profiles
4. PREDICTION GUIDANCE: Help users understand their prediction results and feature importance

Rules:
- Always be empathetic and supportive
- Never diagnose — always recommend consulting a doctor for clinical decisions
- When you extract enough clinical data from conversation, suggest running a prediction
- Format responses with markdown for readability
- Keep responses concise but thorough
- If the user provides health metrics, extract them and format as JSON in your response using this format: [METRICS]{"age":XX,"sex":X,...}[/METRICS]

Clinical parameter reference (for symptom mapping):
- cp (chest pain): 0=typical angina, 1=atypical angina, 2=non-anginal, 3=asymptomatic
- fbs (fasting blood sugar): 0=<=120mg/dl, 1=>120mg/dl
- restecg: 0=normal, 1=ST-T abnormality, 2=LV hypertrophy
- exang (exercise angina): 0=no, 1=yes
- slope (ST slope): 0=upsloping, 1=flat, 2=downsloping
- thal: 0=normal, 1=fixed defect, 2=reversible defect, 3=not described`;

// Helper: call Gemini API with model fallback
async function callGemini(apiKey, contents, config = {}) {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: config.temperature || 0.7,
            maxOutputTokens: config.maxOutputTokens || 1024,
            topP: 0.9,
          },
        },
        { timeout: 30000 }
      );
      return res.data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
      // If rate limited or model not found, try next model
      if (err.response?.status === 429 || err.response?.status === 404) {
        continue;
      }
      throw err;
    }
  }
  // All models rate-limited
  return null;
}

// @desc    Send a chat message
// @route   POST /api/chat/message
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: "🔑 **Gemini API not configured yet.**\n\nTo enable the AI chat assistant, add your `GEMINI_API_KEY` to the backend `.env` file.\n\nIn the meantime, you can:\n- Use the **Prediction Form** to assess your heart disease risk\n- Try the **What-If Simulator** to explore how lifestyle changes affect your risk\n- Check the **Feature Importance** chart to understand which factors matter most",
        extractedMetrics: null,
      });
    }

    // Build conversation for Gemini
    const contents = [];
    contents.push({ role: 'user', parts: [{ text: 'What can you help me with?' }] });
    contents.push({ role: 'model', parts: [{ text: SYSTEM_PROMPT }] });

    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const reply = await callGemini(apiKey, contents);

    if (!reply) {
      // All models rate-limited — use intelligent fallback
      const fallback = generateSmartReply(message);
      return res.json({ reply: fallback, extractedMetrics: null });
    }

    // Check if metrics were extracted
    let extractedMetrics = null;
    const metricsMatch = reply.match(/\[METRICS\](.*?)\[\/METRICS\]/s);
    if (metricsMatch) {
      try {
        extractedMetrics = JSON.parse(metricsMatch[1]);
      } catch (e) { /* ignore */ }
    }

    const cleanReply = reply.replace(/\[METRICS\].*?\[\/METRICS\]/s, '').trim();

    res.json({ reply: cleanReply, extractedMetrics });
  } catch (error) {
    // On any Gemini error, use fallback instead of failing
    console.error('Gemini error:', error.message);
    const fallback = generateSmartReply(req.body.message || '');
    res.json({ reply: fallback, extractedMetrics: null });
  }
};

// @desc    Get lifestyle advice based on prediction
// @route   POST /api/chat/advice
exports.getAdvice = async (req, res, next) => {
  try {
    const { riskScore, riskCategory, featureImportance } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const advice = generateBasicAdvice(riskScore, riskCategory, featureImportance);
      return res.json({ advice });
    }

    const prompt = `Based on a heart disease risk assessment:
- Risk Score: ${(riskScore * 100).toFixed(1)}%
- Risk Category: ${riskCategory}
- Top Risk Factors: ${JSON.stringify(featureImportance)}

Provide personalized, actionable lifestyle advice in these categories:
1. 🥗 Diet recommendations
2. 🏋️ Exercise plan
3. ⚠️ Precautions
4. 📋 Recommended tests

Keep it concise with bullet points. Be supportive and encouraging.`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const advice = await callGemini(apiKey, contents, { temperature: 0.6, maxOutputTokens: 800 });

    if (!advice) {
      return res.json({ advice: generateBasicAdvice(riskScore, riskCategory, featureImportance) });
    }

    res.json({ advice });
  } catch (error) {
    const advice = generateBasicAdvice(req.body.riskScore, req.body.riskCategory, req.body.featureImportance);
    res.json({ advice });
  }
};

// Smart fallback when Gemini is unavailable
function generateSmartReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes('chest pain') || msg.includes('chest') || msg.includes('pain')) {
    return "## 🫀 About Chest Pain\n\nChest pain can have many causes. In cardiac assessment, pain is classified as:\n- **Typical angina**: Substernal chest discomfort triggered by exertion, relieved by rest/nitroglycerin\n- **Atypical angina**: Has some but not all features of typical angina\n- **Non-anginal pain**: Doesn't fit the angina pattern\n- **Asymptomatic**: No chest pain\n\n⚠️ **If you're experiencing chest pain now, please seek immediate medical attention.**\n\nYou can use the **Prediction Form** on the Dashboard to input your chest pain type along with other clinical parameters for a risk assessment.";
  }

  if (msg.includes('blood pressure') || msg.includes('bp') || msg.includes('hypertension')) {
    return "## 💢 Blood Pressure & Heart Health\n\nHigh blood pressure (hypertension) is a major risk factor for heart disease.\n\n**Healthy ranges:**\n- Normal: < 120/80 mmHg\n- Elevated: 120-129 / < 80 mmHg\n- High (Stage 1): 130-139 / 80-89 mmHg\n- High (Stage 2): ≥ 140 / ≥ 90 mmHg\n\n**Tips to manage BP:**\n- Reduce sodium intake (< 2,300 mg/day)\n- Exercise regularly (150 min/week)\n- Manage stress through meditation\n- Limit alcohol consumption\n\nTry the **What-If Simulator** to see how BP changes affect your risk score!";
  }

  if (msg.includes('cholesterol') || msg.includes('chol')) {
    return "## 🩸 Cholesterol & Heart Risk\n\nHigh cholesterol contributes to plaque buildup in arteries.\n\n**Target levels:**\n- Total cholesterol: < 200 mg/dL (ideal)\n- LDL (bad): < 100 mg/dL\n- HDL (good): > 40-60 mg/dL\n\n**Ways to lower cholesterol:**\n- Eat foods rich in omega-3 (salmon, walnuts)\n- Increase soluble fiber (oats, beans)\n- Avoid trans fats and limit saturated fats\n- Exercise 30+ minutes most days\n\nUse the **Simulator** to see how cholesterol changes impact your risk!";
  }

  if (msg.includes('diet') || msg.includes('food') || msg.includes('eat')) {
    return "## 🥗 Heart-Healthy Diet\n\n**Recommended foods:**\n- 🐟 Fatty fish (salmon, mackerel) 2x/week\n- 🥬 Leafy greens (spinach, kale)\n- 🫐 Berries and colorful fruits\n- 🥜 Nuts and seeds\n- 🫘 Whole grains and legumes\n\n**Foods to limit:**\n- ❌ Processed meats\n- ❌ Sugary beverages\n- ❌ Excessive salt\n- ❌ Trans fats\n\nConsider the **DASH diet** or **Mediterranean diet** — both are clinically proven to reduce cardiovascular risk.";
  }

  if (msg.includes('exercise') || msg.includes('workout') || msg.includes('fitness')) {
    return "## 🏋️ Exercise for Heart Health\n\n**Recommended routine:**\n- **150 min/week** moderate aerobic activity (brisk walking, swimming)\n- **OR 75 min/week** vigorous activity (running, cycling)\n- **Strength training** 2x per week\n\n**Benefits:**\n- Lowers blood pressure by 5-8 mmHg\n- Raises HDL (good) cholesterol\n- Improves heart rate recovery\n- Reduces stress hormones\n\n⚠️ If you have existing heart conditions, consult your doctor before starting intense exercise.\n\nTry adjusting `Max Heart Rate` in the **Simulator** to see its impact!";
  }

  return "## 👋 Hello! I'm HeartGuard AI\n\nI'm your cardiac health assistant. I can help you with:\n\n- 🫀 **Understanding heart health** — Ask about risk factors like blood pressure, cholesterol, chest pain\n- 🥗 **Diet advice** — Heart-healthy nutrition tips\n- 🏋️ **Exercise guidance** — Safe workout recommendations\n- 📊 **Prediction help** — Understanding your risk score\n\n**Try asking me:**\n- \"What does my cholesterol level mean?\"\n- \"How can I lower my blood pressure?\"\n- \"What diet is best for heart health?\"\n\n*Note: Gemini AI is temporarily rate-limited. I'm using built-in knowledge to assist you.*";
}

function generateBasicAdvice(riskScore, riskCategory, featureImportance) {
  const tips = [];
  const pct = Math.round((riskScore || 0) * 100);

  tips.push('## 🥗 Diet Recommendations');
  if (pct >= 50) {
    tips.push('- Follow a **DASH diet** (low sodium, high potassium)');
    tips.push('- Limit saturated fats to <7% of daily calories');
    tips.push('- Increase omega-3 fatty acids (fish, walnuts, flaxseed)');
  }
  tips.push('- Eat 5+ servings of fruits and vegetables daily');
  tips.push('- Choose whole grains over refined carbohydrates');

  tips.push('\n## 🏋️ Exercise Plan');
  tips.push('- Aim for **150 minutes** of moderate aerobic activity per week');
  tips.push('- Include strength training 2x per week');
  if (pct >= 70) {
    tips.push('- ⚠️ Start slowly and consult your doctor before intense exercise');
  }

  tips.push('\n## ⚠️ Precautions');
  if (pct >= 50) tips.push('- Schedule regular cardiology check-ups');
  tips.push('- Monitor blood pressure and cholesterol regularly');
  tips.push('- Manage stress through meditation or yoga');

  return tips.join('\n');
}
