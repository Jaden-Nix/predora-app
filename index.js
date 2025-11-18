/*
 * index.js - The Secure Backend Server for Predora
 *
 * FINAL VERSION 3 - Includes Vercel Routing Fix for /app.html
 */

// --- ESM Imports ---
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin'; // Use the ADMIN SDK

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const APP_ID = 'predora-hackathon';

// --- Firebase Admin SDK Initialization ---
try {
    const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountString) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS secret is not set.");
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (e) {
    console.error("CRITICAL: Firebase Admin initialization failed.", e.message);
}

const db = admin.firestore();
const app = express();

// --- Express Middleware ---
app.use(express.json());
app.use(cors());

// Add cache control headers for all static files
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static(path.join(__dirname, '/')));

// --- Main Route: Serve the Landing Page ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- VERCEL FIX: Route for the App Page ---
// This tells the server explicitly how to handle the /app.html request
app.get('/app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// --- API Endpoint 1: Secure AI Proxy ---
/**
 * This endpoint handles 'tools' (for Search/Functions)
 * AND 'jsonSchema' (for JSON Mode).
 */
app.post('/api/gemini', async (req, res) => {
    console.log("Server: /api/gemini endpoint hit");

    // 1. Get ALL parts from the frontend
    const { systemPrompt, userPrompt, tools, jsonSchema } = req.body;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "API Key is not set up on the server." });
    }
    if (!systemPrompt || !userPrompt) {
        return res.status(400).json({ error: "Missing systemPrompt or userPrompt" });
    }

    // 2. Build the base payload
    const payload = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [
            { parts: [{ text: userPrompt }] }
        ]
    };

    // 3. Add tools OR generationConfig
    if (jsonSchema) {
        // JSON Mode (for AI Judge)
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: jsonSchema
        };
    } else {
        // Normal text or Function Calling Mode (for AI Assist / Explain)
        payload.tools = tools; 
    }

    // 4. Call the Google API
    try {
        const googleResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await googleResponse.json();

        if (!googleResponse.ok) {
            console.error("Google API Error:", data);
            return res.status(googleResponse.status).json(data);
        }
        res.status(200).json(data);

    } catch (error) {
        console.error("Error in /api/gemini:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- Internal Helper: Secure AI Caller (for Oracle) ---
async function callGoogleApi(payload) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");

    const googleResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
        console.error("Oracle Google API Error:", data);
        throw new Error(`Google API Error: ${data.error.message}`);
    }

    return data;
}

// --- Oracle Job 1: Auto-Resolve Markets ---
async function autoResolveMarkets() {
    console.log("ORACLE: Running autoResolveMarkets...");
    const today = new Date().toISOString().split('T')[0];

    const collectionPath = `artifacts/${APP_ID}/public/data/standard_markets`;
    const q = db.collection(collectionPath).where('isResolved', '==', false);
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.log("ORACLE: No unresolved markets found.");
        return;
    }

    const marketsToResolve = snapshot.docs.filter(doc => 
        doc.data().resolutionDate <= today
    );

    if (marketsToResolve.length === 0) {
        console.log("ORACLE: No markets are due for resolution.");
        return;
    }

    console.log(`ORACLE: Found ${marketsToResolve.length} markets to resolve.`);
    let resolvedCount = 0;

    for (const doc of marketsToResolve) {
        const market = doc.data();
        const marketId = doc.id;
        const marketTitle = market.title;

        let winningOutcome;

        try {
            // Check if this is a multi-option market
            if (market.marketStructure === 'multi-option' && market.options && market.options.length > 0) {
                // Multi-option market resolution
                const optionsText = market.options.map(opt => `"${opt.id}": ${opt.label}`).join(', ');
                const systemPrompt = `As of ${today}, determine which ONE option is the correct outcome for this prediction market. Respond ONLY with the option ID (like "opt_0", "opt_1", etc.) or "AMBIGUOUS" if unclear.`;
                const userPrompt = `Market: "${marketTitle}"\n\nOptions: ${optionsText}`;

                const payload = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    tools: [{ "google_search": {} }]
                };

                const response = await callGoogleApi(payload);
                const outcome = response.candidates[0].content.parts[0].text;
                winningOutcome = outcome.trim().replace(/^["']|["']$/g, '');

                const validOptionIds = market.options.map(opt => opt.id);
                if (!validOptionIds.includes(winningOutcome) && winningOutcome.toUpperCase() !== 'AMBIGUOUS') {
                    console.log(`ORACLE: Invalid multi-option outcome "${winningOutcome}" for market ${marketId}. Setting to AMBIGUOUS.`);
                    winningOutcome = 'AMBIGUOUS';
                }
            } else {
                // Binary YES/NO market resolution
                const systemPrompt = `As of ${today}, what was the outcome of "[Market Title]"? Respond ONLY 'YES', 'NO', 'AMBIGUOUS'.`;
                const userPrompt = `Market Title: "${marketTitle}"`;
                const payload = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    tools: [{ "google_search": {} }]
                };

                const response = await callGoogleApi(payload);
                const outcome = response.candidates[0].content.parts[0].text;
                winningOutcome = outcome.trim().toUpperCase();
            }

            const isBinaryResolution = winningOutcome === 'YES' || winningOutcome === 'NO';
            const isMultiOptionResolution = market.marketStructure === 'multi-option' && 
                                            market.options.some(opt => opt.id === winningOutcome);

            if (isBinaryResolution || isMultiOptionResolution) {
                console.log(`ORACLE: Resolving market ${marketId} as ${winningOutcome}. Now processing payouts...`);

                const pledgeCollectionPath = `artifacts/${APP_ID}/public/data/pledges`;
                const pledgeQuery = db.collection(pledgeCollectionPath)
                    .where('marketId', '==', marketId)
                    .where('isResolved', '==', false);

                const pledgeSnapshot = await pledgeQuery.get();
                const batch = db.batch();

                batch.update(doc.ref, {
                    isResolved: true,
                    winningOutcome: winningOutcome
                });

                if (!pledgeSnapshot.empty) {
                    for (const pledgeDoc of pledgeSnapshot.docs) {
                        const pledge = pledgeDoc.data();
                        const isWinner = pledge.pick === winningOutcome;

                        let winningOdds = 50; 
                        if (market.marketStructure === 'multi-option') {
                            const winningOption = market.options.find(opt => opt.id === winningOutcome);
                            winningOdds = winningOption ? winningOption.odds : 100;
                        } else {
                            winningOdds = winningOutcome === 'YES' 
                                ? (market.yesPercent || 60) 
                                : (market.noPercent || 40);
                        }

                        const payoutUsd = isWinner ? (pledge.amountUsd / (winningOdds / 100)) : 0;
                        const principalReturn = market.isNoLoss ? pledge.amountUsd : 0;
                        const totalReturnUsd = isWinner ? payoutUsd : principalReturn;
                        const payoutAmount = totalReturnUsd / getMockPrice(pledge.asset);

                        let xpChange = isWinner ? (10 + Math.floor(pledge.amountUsd / 5)) : -10;
                        if (isWinner) {
                            if (pledge.amountUsd <= 50) xpChange *= 5;
                            else if (pledge.amountUsd >= 1000) xpChange = Math.floor(xpChange / 2);
                        }

                        const streakUpdate = isWinner ? admin.firestore.FieldValue.increment(1) : 0;

                        batch.update(pledgeDoc.ref, {
                            isResolved: true,
                            isWinner: isWinner,
                            payout: totalReturnUsd
                        });

                        const profileRef = db.doc(`artifacts/${APP_ID}/public/data/profile/${pledge.userId}`);
                        batch.update(profileRef, {
                            [getBalanceField(pledge.asset)]: admin.firestore.FieldValue.increment(payoutAmount),
                            xp: admin.firestore.FieldValue.increment(xpChange),
                            streak: streakUpdate
                        });

                        const publicProfileRef = db.doc(`artifacts/${APP_ID}/public/data/leaderboard/${pledge.userId}`);
                        batch.update(publicProfileRef, {
                            xp: admin.firestore.FieldValue.increment(xpChange)
                        });
                    }
                    console.log(`ORACLE: Processed ${pledgeSnapshot.size} pledges for market ${marketId}.`);
                }

                await batch.commit();
                resolvedCount++;

            } else {
                console.log(`ORACLE: Market ${marketId} outcome is AMBIGUOUS. Skipping.`);
            }
        } catch (e) {
            console.error(`ORACLE: Failed to resolve market ${marketId}:`, e.message);
        }
    }
    console.log(`ORACLE: Finished. Resolved ${resolvedCount} markets.`);
}

// --- Oracle Job 2: Create Daily Markets ---
async function createDailyMarkets() {
    console.log("ORACLE: Running createDailyMarkets...");
    const todayId = new Date().toISOString().split('T')[0];

    const flagRef = db.collection('artifacts').doc(APP_ID).collection('dailyFlags').doc(todayId);
    const flagDoc = await flagRef.get();

    if (flagDoc.exists) {
        console.log("ORACLE: Daily markets already created. Skipping.");
        return;
    }

    // --- Tool Definition ---
    const createMarketTool = {
        "functionDeclarations": [{
            "name": "create_market_form",
            "description": "Creates a new prediction market.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "title": { "type": "STRING" }, "insight": { "type": "STRING" },
                    "resolutionDate": { "type": "STRING" },
                    "yesPercent": { "type": "NUMBER" }, "noPercent": { "type": "NUMBER" }
                }, "required": ["title", "insight", "resolutionDate", "yesPercent", "noPercent"]
            }
        }]
    };
    const functionTools = [ createMarketTool ];
    const searchTools = [{ "google_search": {} }];
    // --- End Tool Definition ---

    const topics = ["global news", "crypto", "pop culture"];

    for (const topic of topics) {
        try {
            // CALL 1: Get Ideas
            const systemPrompt_1 = `You are a research assistant. Use Google Search to find up-to-date, real-time information.
Find a *single, specific, future-focused* event (for 2025 or 2026) about the user's topic.
Respond ONLY with a 1-2 sentence summary of this event.`;
            const userPrompt_1 = `Topic: "${topic}"`;

            const payload_1 = {
                systemInstruction: { parts: [{ text: systemPrompt_1 }] },
                contents: [{ parts: [{ text: userPrompt_1 }] }],
                tools: searchTools
            };
            const response_1 = await callGoogleApi(payload_1);
            const ideaText = response_1.candidates[0].content.parts[0].text;

            if (!ideaText || ideaText.length < 10) throw new Error("AI (Step 1) failed.");

            // CALL 2: Auto-Fill Form
            const systemPrompt_2 = `You are a market creator. A user has provided context about a future event.
Your ONLY job is to use the 'create_market_form' tool.
The 'title' must be a yes/no question.
The 'insight' must be a brief summary of the context.
The 'resolutionDate' must be in 'YYYY-MM-DD' format (for 2025 or 2026).
Odds (yesPercent, noPercent) must be between 1 and 99, and sum to 100.
You MUST use the 'create_market_form' tool.`;
            const userPrompt_2 = `Context: "${ideaText}"`;

            const payload_2 = {
                systemInstruction: { parts: [{ text: systemPrompt_2 }] },
                contents: [{ parts: [{ text: userPrompt_2 }] }],
                tools: functionTools
            };
            const response_2 = await callGoogleApi(payload_2);
            const part = response_2.candidates[0].content.parts[0];

            if (part.functionCall && part.functionCall.name === 'create_market_form') {
                const marketData = part.functionCall.args;
                const yesP = parseFloat(marketData.yesPercent);
                const noP = parseFloat(marketData.noPercent);

                const newMarketDoc = {
                    ...marketData,
                    isResolved: false, isNoLoss: true, yieldProtocol: 'aave',
                    creatorId: 'AI_ORACLE',
                    yesPercent: yesP, noPercent: noP,
                    yesPool: 1000 * (yesP / 100), noPool: 1000 * (noP / 100),
                    totalStakeVolume: 0,
                    refundVolumeGoal: 100, refundStakerGoal: 10,
                    creationTimestamp: admin.firestore.FieldValue.serverTimestamp()
                };

                const collectionPath = `artifacts/${APP_ID}/public/data/standard_markets`;
                await db.collection(collectionPath).add(newMarketDoc);
                console.log(`ORACLE: Created market: ${marketData.title}`);
            } else {
                throw new Error("AI (Step 2) failed to use function call.");
            }
        } catch (e) {
            console.error(`ORACLE: Failed to create market for ${topic}:`, e.message);
        }
    }
    await flagRef.set({ ranAt: admin.firestore.FieldValue.serverTimestamp() });
}

// --- Oracle Job 3: Auto-Generate Quick Play Events ---
async function autoGenerateQuickPlays() {
    console.log("ORACLE: Auto-generating 2 Quick Play events...");

    const topics = ['global politics', 'cryptocurrency markets', 'tech industry news', 'sports championships', 'entertainment awards', 'stock market movements', 'gaming esports', 'social media trends', 'climate events', 'space exploration'];
    const randomTopic1 = topics[Math.floor(Math.random() * topics.length)];
    const randomTopic2 = topics[Math.floor(Math.random() * topics.length)];

    for (const topic of [randomTopic1, randomTopic2]) {
        try {
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const systemPrompt = `You are a creative prediction market curator. Generate a timely, engaging YES/NO prediction question about ${topic} that will resolve within 24-48 hours. Make it specific, verifiable, and exciting for GenZ users.`;
            const userPrompt = `Generate a Quick Play prediction market about ${topic}. Return a title, 24-48 hour timeframe, and balanced odds.`;

            const schema = {
                type: "OBJECT",
                properties: {
                    "title": { "type": "STRING" },
                    "durationHours": { "type": "NUMBER" },
                    "yesPercent": { "type": "NUMBER" },
                    "noPercent": { "type": "NUMBER" }
                },
                required: ["title", "durationHours", "yesPercent", "noPercent"]
            };

            const payload = {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            };

            const response = await callGoogleApi(payload);
            const data = JSON.parse(response.candidates[0].content.parts[0].text);

            const now = new Date();
            const expiryTime = new Date(now.getTime() + (data.durationHours * 60 * 60 * 1000));

            const collectionPath = `artifacts/${APP_ID}/public/data/quick_play_markets`;
            await db.collection(collectionPath).add({
                title: data.title,
                yesPercent: Math.round(data.yesPercent),
                noPercent: Math.round(data.noPercent),
                expiresAt: expiryTime.toISOString(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isResolved: false,
                isMock: false,
                autoGenerated: true
            });

            console.log(`ORACLE: Auto-generated Quick Play: "${data.title}"`);
        } catch (error) {
            console.error(`ORACLE: Failed to generate Quick Play for topic ${topic}:`, error);
        }
    }
    console.log("ORACLE: Finished auto-generating Quick Play events.");
}

// --- Helper: AI-Powered Outcome Verification ---
async function verifyOutcomeWithAI(question) {
    console.log(`  Verifying outcome for: "${question}"`);
    try {
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const systemPrompt = `You are a fact-checking oracle. Your job is to determine if a YES/NO prediction question has resolved as YES or NO based on current factual information. Today is ${today}. Use web search to verify current facts and news.`;
        const userPrompt = `Question: "${question}"\n\nHas this resolved as YES or NO? If you cannot determine with confidence, respond with UNKNOWN.`;

        const schema = {
            type: "OBJECT",
            properties: {
                "outcome": { "type": "STRING", "description": "YES, NO, or UNKNOWN" },
                "confidence": { "type": "STRING", "description": "HIGH, MEDIUM, or LOW" },
                "reasoning": { "type": "STRING" }
            },
            required: ["outcome", "confidence", "reasoning"]
        };

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: schema },
            tools: [{ google_search: {} }]
        };

        const response = await callGoogleApi(payload);
        const result = JSON.parse(response.candidates[0].content.parts[0].text);
        console.log(`  AI Outcome: ${result.outcome} (${result.confidence} confidence)`);
        return result;
    } catch (error) {
        console.error(`  AI verification failed:`, error.message);
        return { outcome: 'UNKNOWN', confidence: 'LOW', reasoning: 'AI verification error' };
    }
}

// --- Oracle Job 4: Auto-Resolve Quick Polls ---
async function autoResolveQuickPolls() {
    console.log("ORACLE: Auto-resolving expired Quick Polls with AI...");
    try {
        const pollsRef = db.collection(`artifacts/${APP_ID}/public/data/quick_polls`);
        const now = new Date();

        const snapshot = await pollsRef.where('isResolved', '==', false).get();

        if (snapshot.empty) {
            console.log("ORACLE: No Quick Polls to resolve.");
            return;
        }

        let resolvedCount = 0;
        let batchHasUpdates = false;
        const batch = db.batch();

        for (const pollDoc of snapshot.docs) {
            const poll = pollDoc.data();
            const createdAt = poll.createdAt?.toDate() || new Date(0);
            const resolutionHours = poll.resolutionHours || 24;
            const pollExpiryThreshold = new Date(now.getTime() - (resolutionHours * 60 * 60 * 1000));

            if (createdAt < pollExpiryThreshold) {
                const yesVotes = poll.yesVotes || 0;
                const noVotes = poll.noVotes || 0;
                const totalVotes = yesVotes + noVotes;

                if (totalVotes === 0) {
                    batch.update(pollDoc.ref, { 
                        isResolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                        winningOutcome: 'NO_VOTES', aiReasoning: 'No votes cast'
                    });
                    batchHasUpdates = true; resolvedCount++;
                    continue;
                }

                const aiResult = await verifyOutcomeWithAI(poll.question);
                let winningOutcome = aiResult.outcome;
                const retryAttempts = poll.retryAttempts || 0;

                if (winningOutcome === 'UNKNOWN' || aiResult.confidence === 'LOW') {
                    if (retryAttempts < 5) {
                        batch.update(pollDoc.ref, { retryAttempts: admin.firestore.FieldValue.increment(1) });
                        batchHasUpdates = true; continue;
                    } else {
                        winningOutcome = yesVotes > noVotes ? 'YES' : yesVotes < noVotes ? 'NO' : 'TIE';
                        aiResult.reasoning = `AI uncertain after 5 attempts. Majority vote: ${winningOutcome}`;
                    }
                }

                const xpStakedYES = poll.xpStakedYES || 0;
                const xpStakedNO = poll.xpStakedNO || 0;

                batch.update(pollDoc.ref, { 
                    isResolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    winningOutcome: winningOutcome, aiReasoning: aiResult.reasoning,
                    aiConfidence: aiResult.confidence, retryAttempts: retryAttempts
                });
                batchHasUpdates = true;

                if (winningOutcome !== 'TIE' && poll.voters) {
                    for (const [userId, voterData] of Object.entries(poll.voters)) {
                        const isWinner = voterData.vote === winningOutcome;
                        const xpStaked = voterData.xpStaked || 10;

                        if (isWinner) {
                            const winnerPot = winningOutcome === 'YES' ? xpStakedYES : xpStakedNO;
                            const loserPot = winningOutcome === 'YES' ? xpStakedNO : xpStakedYES;
                            const winnerShare = winnerPot > 0 ? (xpStaked / winnerPot) : 0;
                            const winnings = Math.floor(xpStaked + (loserPot * winnerShare));

                            const profileRef = db.doc(`artifacts/${APP_ID}/public/data/profile/${userId}`);
                            batch.update(profileRef, { xp: admin.firestore.FieldValue.increment(winnings), streak: admin.firestore.FieldValue.increment(1) });

                            const leaderboardRef = db.doc(`artifacts/${APP_ID}/public/data/leaderboard/${userId}`);
                            batch.update(leaderboardRef, { xp: admin.firestore.FieldValue.increment(winnings) });
                        } else {
                            const profileRef = db.doc(`artifacts/${APP_ID}/public/data/profile/${userId}`);
                            batch.update(profileRef, { streak: 0 });
                            const leaderboardRef = db.doc(`artifacts/${APP_ID}/public/data/leaderboard/${userId}`);
                            batch.update(leaderboardRef, { streak: 0 });
                        }
                    }
                } else if (winningOutcome === 'TIE' && poll.voters) {
                    for (const [userId, voterData] of Object.entries(poll.voters)) {
                        const xpStaked = voterData.xpStaked || 10;
                        const profileRef = db.doc(`artifacts/${APP_ID}/public/data/profile/${userId}`);
                        batch.update(profileRef, { xp: admin.firestore.FieldValue.increment(xpStaked) });
                        const leaderboardRef = db.doc(`artifacts/${APP_ID}/public/data/leaderboard/${userId}`);
                        batch.update(leaderboardRef, { xp: admin.firestore.FieldValue.increment(xpStaked) });
                    }
                    batchHasUpdates = true;
                }
                resolvedCount++;
            }
        }

        if (batchHasUpdates) await batch.commit();
        console.log(`ORACLE: Resolved ${resolvedCount} Quick Polls`);

    } catch (error) {
        console.error("ORACLE: Error resolving Quick Polls:", error);
    }
}

// --- Oracle Job 5: Auto-Resolve Quick Play Markets ---
async function autoResolveQuickPlays() {
    console.log("ORACLE: Auto-resolving expired Quick Play markets with AI...");
    try {
        const quickPlaysRef = db.collection(`artifacts/${APP_ID}/public/data/quick_play_markets`);
        const now = new Date();
        const snapshot = await quickPlaysRef.where('isResolved', '==', false).get();

        if (snapshot.empty) {
            console.log("ORACLE: No Quick Play markets to resolve.");
            return;
        }

        let resolvedCount = 0;
        for (const marketDoc of snapshot.docs) {
            const market = marketDoc.data();
            const expiresAt = market.expiresAt ? new Date(market.expiresAt) : null;

            if (expiresAt && now > expiresAt) {
                console.log(`  Resolving Quick Play: "${market.title}"`);
                const aiResult = await verifyOutcomeWithAI(market.title);
                let winningOutcome = aiResult.outcome;
                const retryAttempts = market.retryAttempts || 0;

                if (winningOutcome === 'UNKNOWN' || aiResult.confidence === 'LOW') {
                    if (retryAttempts < 5) {
                        await marketDoc.ref.update({ retryAttempts: admin.firestore.FieldValue.increment(1) });
                        continue;
                    } else {
                        await marketDoc.ref.update({
                            isResolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                            winningOutcome: 'UNRESOLVABLE', aiReasoning: 'AI uncertain after 5 attempts', aiConfidence: 'LOW'
                        });
                        resolvedCount++;
                        continue;
                    }
                }

                await marketDoc.ref.update({
                    isResolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    winningOutcome: winningOutcome, aiReasoning: aiResult.reasoning, aiConfidence: aiResult.confidence
                });
                console.log(`  ✓ Resolved as ${winningOutcome}: "${market.title}"`);
                resolvedCount++;
            }
        }
        console.log(`ORACLE: Resolved ${resolvedCount} Quick Play markets`);
    } catch (error) {
        console.error("ORACLE: Error resolving Quick Play markets:", error);
    }
}

// --- API Endpoint 2: Secure Cron Job Runner ---
app.post('/api/run-jobs', async (req, res) => {
    console.log("Server: /api/run-jobs endpoint hit");
    const { key } = req.body;

    if (!CRON_SECRET || key !== CRON_SECRET) {
        console.warn("ORACLE: Unauthorized attempt to run jobs.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        await autoResolveMarkets();
        await createDailyMarkets();
        await autoGenerateQuickPlays(); 
        await autoResolveQuickPolls(); 
        await autoResolveQuickPlays(); 
        res.status(200).json({ success: true, message: "Oracle jobs ran successfully." });
    } catch (e) {
        console.error("ORACLE: A job failed to run.", e);
        res.status(500).json({ error: "Oracle job execution failed." });
    }
});

// --- HELPER FUNCTIONS ---
function getMockPrice(asset) {
    if (asset === 'BNB') return 500;
    if (asset === 'CAKE') return 3.5;
    return 1;
}

function getBalanceField(asset) {
    if (asset === 'BNB') return 'bnbBalance';
    if (asset === 'CAKE') return 'cakeBalance';
    return 'balance';
}

// --- Start the Server ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Predora Backend Server is live on port ${PORT}`);
    if (!GEMINI_API_KEY) console.warn("WARNING: GEMINI_API_KEY is not set.");
    if (!CRON_SECRET) console.warn("WARNING: CRON_SECRET is not set.");
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) console.warn("INTERNAL: GOOGLE_APPLICATION_CREDENTIALS is not set. Firebase Admin will fail.");
});