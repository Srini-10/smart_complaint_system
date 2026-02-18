/**
 * AI Engine - Keyword-based NLP for complaint classification
 * Uses rule-based text analysis for zero-cost, client-side categorization
 */

import type {
    AIClassificationResult,
    ComplaintCategory,
    PatternInsight,
    Priority,
    Complaint,
} from '@/types';

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ComplaintCategory, string[]> = {
    water: [
        'water', 'pipe', 'leak', 'flood', 'drain', 'sewage', 'tap', 'supply',
        'plumbing', 'overflow', 'blockage', 'contamination', 'dirty water',
        'no water', 'water cut', 'burst pipe', 'moisture', 'damp',
    ],
    electrical: [
        'electricity', 'electric', 'power', 'light', 'bulb', 'wiring', 'socket',
        'switch', 'fuse', 'transformer', 'outage', 'blackout', 'short circuit',
        'voltage', 'generator', 'meter', 'sparks', 'shock', 'no power',
    ],
    internet: [
        'internet', 'wifi', 'network', 'connection', 'broadband', 'router',
        'signal', 'slow internet', 'disconnected', 'bandwidth', 'cable',
        'fiber', 'lan', 'modem', 'connectivity', 'online', 'offline',
    ],
    infrastructure: [
        'road', 'pothole', 'bridge', 'building', 'wall', 'ceiling', 'floor',
        'crack', 'construction', 'pavement', 'sidewalk', 'parking', 'gate',
        'fence', 'roof', 'structure', 'foundation', 'elevator', 'lift',
    ],
    sanitation: [
        'garbage', 'waste', 'trash', 'dustbin', 'cleaning', 'hygiene', 'toilet',
        'bathroom', 'restroom', 'smell', 'odor', 'pest', 'rat', 'cockroach',
        'mosquito', 'dirty', 'filth', 'sweep', 'litter',
    ],
    security: [
        'security', 'theft', 'robbery', 'vandalism', 'cctv', 'camera', 'guard',
        'safety', 'danger', 'threat', 'suspicious', 'break-in', 'trespassing',
        'harassment', 'violence', 'crime', 'police', 'emergency',
    ],
    maintenance: [
        'maintenance', 'repair', 'broken', 'damaged', 'worn', 'old', 'replace',
        'fix', 'service', 'equipment', 'machine', 'appliance', 'furniture',
        'door', 'window', 'lock', 'hinge', 'paint', 'renovation',
    ],
    other: [],
};

// ─── Priority Keywords ────────────────────────────────────────────────────────

const URGENT_KEYWORDS = [
    'urgent', 'emergency', 'critical', 'immediately', 'asap', 'dangerous',
    'hazardous', 'life-threatening', 'fire', 'flood', 'explosion', 'gas leak',
    'electric shock', 'accident', 'injury', 'blood', 'collapse', 'fallen',
];

const HIGH_KEYWORDS = [
    'broken', 'not working', 'completely', 'totally', 'severe', 'major',
    'serious', 'significant', 'important', 'affecting many', 'multiple',
    'days', 'week', 'unbearable', 'intolerable', 'health risk',
];

const LOW_KEYWORDS = [
    'minor', 'small', 'slight', 'little', 'cosmetic', 'aesthetic', 'suggestion',
    'improvement', 'enhancement', 'when possible', 'not urgent', 'low priority',
];

// ─── Text Preprocessing ───────────────────────────────────────────────────────

function preprocessText(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim();
}

function tokenize(text: string): string[] {
    return preprocessText(text).split(/\s+/).filter(Boolean);
}

// ─── Keyword Extraction ───────────────────────────────────────────────────────

export function extractKeywords(text: string): string[] {
    const processed = preprocessText(text);
    const found: string[] = [];

    for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (processed.includes(kw) && !found.includes(kw)) {
                found.push(kw);
            }
        }
    }

    // Also extract urgent/priority keywords
    for (const kw of [...URGENT_KEYWORDS, ...HIGH_KEYWORDS]) {
        if (processed.includes(kw) && !found.includes(kw)) {
            found.push(kw);
        }
    }

    return found.slice(0, 10);
}

// ─── Category Classification ──────────────────────────────────────────────────

function scoreCategory(text: string, category: ComplaintCategory): number {
    const processed = preprocessText(text);
    const keywords = CATEGORY_KEYWORDS[category];
    let score = 0;

    for (const kw of keywords) {
        if (processed.includes(kw)) {
            // Longer keyword matches score higher
            score += kw.split(' ').length > 1 ? 2 : 1;
        }
    }

    return score;
}

export function classifyCategory(text: string): {
    category: ComplaintCategory;
    confidence: number;
} {
    const categories = Object.keys(CATEGORY_KEYWORDS) as ComplaintCategory[];
    const scores: Record<string, number> = {};
    let totalScore = 0;

    for (const cat of categories) {
        if (cat === 'other') continue;
        scores[cat] = scoreCategory(text, cat);
        totalScore += scores[cat];
    }

    if (totalScore === 0) {
        return { category: 'other', confidence: 0.3 };
    }

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const [topCategory, topScore] = sorted[0];
    const confidence = Math.min(topScore / Math.max(totalScore * 0.8, 1), 1);

    return {
        category: topCategory as ComplaintCategory,
        confidence: Math.round(confidence * 100) / 100,
    };
}

// ─── Priority Determination ───────────────────────────────────────────────────

export function determinePriority(text: string, _category: ComplaintCategory): Priority {
    const processed = preprocessText(text);

    // Check urgent keywords
    for (const kw of URGENT_KEYWORDS) {
        if (processed.includes(kw)) return 'urgent';
    }

    // Check high keywords
    for (const kw of HIGH_KEYWORDS) {
        if (processed.includes(kw)) return 'high';
    }

    // Check low keywords
    for (const kw of LOW_KEYWORDS) {
        if (processed.includes(kw)) return 'low';
    }

    // Category-based default priorities
    const categoryPriorities: Partial<Record<ComplaintCategory, Priority>> = {
        electrical: 'high',
        water: 'high',
        security: 'high',
        infrastructure: 'normal',
        internet: 'normal',
        sanitation: 'normal',
        maintenance: 'low',
    };

    return categoryPriorities[_category] ?? 'normal';
}

// ─── Full Classification ──────────────────────────────────────────────────────

export function classifyComplaint(
    title: string,
    description: string,
    departments: { id: string; categories: string[] }[] = []
): AIClassificationResult {
    const fullText = `${title} ${description}`;
    const { category, confidence } = classifyCategory(fullText);
    const priority = determinePriority(fullText, category);
    const keywords = extractKeywords(fullText);

    // Find matching department
    const suggestedDepartment = departments.find((d) =>
        d.categories.includes(category)
    );

    return {
        category,
        confidence,
        priority,
        keywords,
        suggestedDepartmentId: suggestedDepartment?.id,
    };
}

// ─── Pattern Analysis ─────────────────────────────────────────────────────────

export function analyzePatterns(complaints: Complaint[]): PatternInsight[] {
    const categoryCount: Partial<Record<ComplaintCategory, number>> = {};
    const categoryByDay: Partial<Record<ComplaintCategory, Record<string, number>>> = {};

    for (const c of complaints) {
        const cat = c.category;
        categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;

        const day = new Date(c.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        if (!categoryByDay[cat]) categoryByDay[cat] = {};
        categoryByDay[cat]![day] = (categoryByDay[cat]![day] ?? 0) + 1;
    }

    const total = complaints.length || 1;
    const insights: PatternInsight[] = [];

    for (const [cat, count] of Object.entries(categoryCount)) {
        const category = cat as ComplaintCategory;
        const dayMap = categoryByDay[category] ?? {};
        const peakDays = Object.entries(dayMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([day]) => day);

        const frequency = Math.round((count / total) * 100);

        let recommendation = '';
        if (frequency > 30) {
            recommendation = `High volume of ${category} complaints. Consider preventive maintenance schedule.`;
        } else if (frequency > 15) {
            recommendation = `Moderate ${category} issues. Review infrastructure condition.`;
        } else {
            recommendation = `${category} complaints are within normal range.`;
        }

        insights.push({
            category,
            frequency,
            trend: frequency > 20 ? 'increasing' : frequency > 10 ? 'stable' : 'decreasing',
            peakDays,
            recommendation,
        });
    }

    return insights.sort((a, b) => b.frequency - a.frequency);
}

// ─── Sentiment Analysis (simple) ──────────────────────────────────────────────

const NEGATIVE_WORDS = [
    'terrible', 'horrible', 'awful', 'disgusting', 'unacceptable', 'worst',
    'pathetic', 'useless', 'incompetent', 'negligent', 'frustrated', 'angry',
];

const POSITIVE_WORDS = [
    'good', 'great', 'excellent', 'satisfied', 'happy', 'resolved', 'fixed',
    'improved', 'better', 'appreciate', 'thank',
];

export function analyzeSentiment(text: string): 'negative' | 'neutral' | 'positive' {
    const processed = preprocessText(text);
    const tokens = tokenize(processed);

    let score = 0;
    for (const token of tokens) {
        if (NEGATIVE_WORDS.includes(token)) score -= 1;
        if (POSITIVE_WORDS.includes(token)) score += 1;
    }

    if (score < -1) return 'negative';
    if (score > 0) return 'positive';
    return 'neutral';
}
