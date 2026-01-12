/**
 * AI Calling Assistant Service
 * Provides AI-powered suggestions for telecalling: scripts, predictions, next actions
 */

/**
 * Generate context-aware calling script
 * @param {Object} lead - Lead data
 * @param {string} callType - Type of call: intro, followup, closing
 * @returns {Object} Generated script with sections
 */
export const generateCallingScript = (lead, callType = 'intro') => {
    const scripts = {
        intro: generateIntroScript(lead),
        followup: generateFollowupScript(lead),
        closing: generateClosingScript(lead)
    };

    return scripts[callType] || scripts.intro;
};

/**
 * Generate introduction script for new leads
 */
const generateIntroScript = (lead) => {
    const name = lead.name || 'there';
    const source = lead.source || 'unknown';
    const company = lead.company || 'your organization';

    const sourceIntros = {
        website: `I noticed you visited our website recently`,
        referral: `${lead.referredBy || 'A colleague'} recommended I reach out to you`,
        event: `We met at ${lead.eventName || 'the recent event'}`,
        cold: `I'm reaching out because I believe we can help ${company}`,
        'bulk-upload': `I'm reaching out to introduce our services`
    };

    const intro = sourceIntros[source] || sourceIntros['bulk-upload'];

    return {
        greeting: `Hi ${name}, this is [Your Name] from Sandhya Management.`,
        opening: intro + ` and wanted to connect with you.`,
        purpose: `We specialize in [your product/service] and I believe we can help ${company === 'your organization' ? 'you' : company} with [specific benefit].`,
        question: `Are you currently looking for solutions in this area?`,
        yesResponse: `Great! Let me tell you about how we've helped companies like yours...`,
        noResponse: `No problem at all! Would it be okay if I send over some information you canreview at your convenience?`,
        closing: `What would be a good time to schedule a quick 15-minute call to discuss this further?`,
        talkPoints: [
            `Mention specific pain points in their industry`,
            `Highlight recent success stories`,
            `Keep it conversational and friendly`,
            `Listen for buying signals`
        ]
    };
};

/**
 * Generate follow-up script
 */
const generateFollowupScript = (lead) => {
    const name = lead.name || 'there';
    const lastCallDate = lead.lastCallDate || 'our last conversation';
    const notes = lead.notes || '';

    return {
        greeting: `Hi ${name}, this is [Your Name] from Sandhya Management.`,
        opening: `I wanted to follow up on ${lastCallDate === 'our last conversation' ? 'our last conversation' : 'our call on ' + lastCallDate}.`,
        recall: notes ? `You mentioned "${notes.substring(0, 100)}..."` : `We discussed how we could help your business.`,
        question: `Have you had a chance to think about what we discussed?`,
        yesResponse: `Excellent! What are your thoughts? Do you have any questions I can answer?`,
        noResponse: `That's perfectly fine. Let me quickly recap the key benefits...`,
        nextSteps: `Would you like to move forward with [next step - demo/trial/meeting]?`,
        talkPoints: [
            `Reference previous conversation`,
            `Address any concerns raised`,
            `Provide additional value`,
            `Create urgency without pressure`
        ]
    };
};

/**
 * Generate closing script
 */
const generateClosingScript = (lead) => {
    const name = lead.name || 'there';

    return {
        greeting: `Hi ${name}, this is [Your Name] from Sandhya Management.`,
        opening: `I'm calling because I'd love to finalize the details we've been discussing.`,
        recap: `Just to recap, we've discussed [solution] which will help you [benefit].`,
        proposal: `I have a proposal ready that I think you'll find very attractive.`,
        question: `Are you ready to move forward today?`,
        yesResponse: `Fantastic! Let me walk you through the next steps...`,
        objectionHandling: `I understand your concerns. Let me address those specifically...`,
        closing: `Shall we get the paperwork started today?`,
        talkPoints: [
            `Reinforce value proposition`,
            `Handle objections with empathy`,
            `Create sense of urgency`,
            `Make it easy to say yes`
        ]
    };
};

/**
 * Predict lead response likelihood
 * @param {Object} lead - Lead data
 * @returns {Object} Prediction with score and reasoning
 */
export const predictLeadResponse = (lead) => {
    let score = 50; // Base score
    const reasons = [];

    // Source scoring
    const sourceScores = {
        referral: 25,
        website: 15,
        event: 20,
        cold: 0,
        'bulk-upload': 5
    };
    score += sourceScores[lead.source] || 0;
    if (lead.source === 'referral') {
        reasons.push('Referral leads have 65% higher conversion rate');
    }

    // Priority scoring
    if (lead.priority === 'high') {
        score += 15;
        reasons.push('Marked as high priority');
    } else if (lead.priority === 'low') {
        score -= 10;
    }

    // Engagement scoring
    if (lead.callCount > 0) {
        score += Math.min(lead.callCount * 5, 20);
        reasons.push(`${lead.callCount} previous call${lead.callCount > 1 ? 's' : ''} shows engagement`);
    }

    // Status scoring
    if (lead.status === 'interested') {
        score += 20;
        reasons.push('Lead has expressed interest');
    } else if (lead.status === 'not-interested') {
        score = Math.min(score, 30);
        reasons.push('Previously marked as not interested');
    }

    // Email presence
    if (lead.email && lead.email.trim() !== '') {
        score += 5;
    }

    // Company presence
    if (lead.company && lead.company.trim() !== '') {
        score += 5;
        reasons.push('Has company affiliation');
    }

    // Response time (if available)
    if (lead.lastCallDate && lead.status === 'follow-up') {
        const daysSinceCall = Math.floor((new Date() - new Date(lead.lastCallDate)) / (1000 * 60 * 60 * 24));
        if (daysSinceCall <= 2) {
            score += 10;
            reasons.push('Recent engagement - strike while hot!');
        } else if (daysSinceCall > 7) {
            score -= 10;
            reasons.push('Lead may be getting cold');
        }
    }

    // Cap score between 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine confidence and likelihood
    let confidence, likelihood;
    if (score >= 75) {
        confidence = 'high';
        likelihood = 'Highly likely to convert';
    } else if (score >= 50) {
        confidence = 'medium';
        likelihood = 'Moderate conversion potential';
    } else {
        confidence = 'low';
        likelihood = 'Needs nurturing';
    }

    return {
        score: Math.round(score),
        confidence,
        likelihood,
        reasons: reasons.length > 0 ? reasons : ['Standard lead profile']
    };
};

/**
 * Suggest next best action
 * @param {Object} lead - Lead data
 * @returns {Object} Action suggestion with details
 */
export const suggestNextAction = (lead) => {
    const prediction = predictLeadResponse(lead);

    // Never called
    if (lead.callCount === 0) {
        return {
            action: 'Make first call',
            priority: lead.priority === 'high' ? 'urgent' : 'normal',
            when: 'Today',
            why: 'Fresh lead - make contact within 24 hours for best results',
            script: 'intro',
            talkPoints: [
                'Build rapport quickly',
                'Understand their pain points',
                'Set expectations for follow-up',
                'Qualify budget and timeline'
            ]
        };
    }

    // High interest
    if (lead.status === 'interested') {
        return {
            action: 'Schedule product demo',
            priority: 'urgent',
            when: 'Within 48 hours',
            why: 'Lead is hot - move quickly to proposal stage',
            script: 'closing',
            talkPoints: [
                'Demonstrate key features',
                'Address specific requirements',
                'Discuss pricing and packages',
                'Set timeline for decision'
            ]
        };
    }

    // Follow-up needed
    if (lead.status === 'follow-up') {
        const daysSinceCall = lead.lastCallDate
            ? Math.floor((new Date() - new Date(lead.lastCallDate)) / (1000 * 60 * 60 * 24))
            : 999;

        if (daysSinceCall > 5) {
            return {
                action: 'Urgent follow-up required',
                priority: 'urgent',
                when: 'Today',
                why: `${daysSinceCall} days since last contact - lead is getting cold`,
                script: 'followup',
                talkPoints: [
                    'Acknowledge the delay',
                    'Provide new value/information',
                    'Re-qualify interest level',
                    'Set firm next steps'
                ]
            };
        } else {
            return {
                action: 'Follow-up call',
                priority: 'normal',
                when: lead.nextCallDate || 'Within 2 days',
                why: 'Continue nurturing relationship',
                script: 'followup',
                talkPoints: [
                    'Reference previous discussion',
                    'Share relevant case study',
                    'Answer outstanding questions',
                    'Move toward commitment'
                ]
            };
        }
    }

    // Not interested
    if (lead.status === 'not-interested') {
        return {
            action: 'Long-term nurturing',
            priority: 'low',
            when: 'In 30 days',
            why: 'Keep lead warm with educational content',
            script: 'intro',
            talkPoints: [
                'Share industry insights',
                'Offer value without selling',
                'Ask about changing priorities',
                'Stay top of mind'
            ]
        };
    }

    // Default
    return {
        action: 'Continue outreach',
        priority: 'normal',
        when: 'This week',
        why: 'Maintain consistent communication',
        script: 'followup',
        talkPoints: [
            'Build relationship',
            'Understand needs',
            'Provide solutions',
            'Set clear next steps'
        ]
    };
};

/**
 * Get talk track library
 * @param {string} category - Category of talk tracks
 * @returns {Array} Talk tracks
 */
export const getTalkTrackLibrary = (category = 'all') => {
    const library = {
        objections: [
            {
                objection: "It's too expensive",
                response: "I understand budget is important. Let's look at the ROI you'll get. Many clients see X% increase in efficiency, which pays for itself in Y months."
            },
            {
                objection: "I need to think about it",
                response: "Of course! What specific aspects would you like to think over? I can provide additional information that might help your decision."
            },
            {
                objection: "We're happy with our current solution",
                response: "That's great to hear! Are there any areas where you feel there's room for improvement? We specialize in..."
            },
            {
                objection: "Not the right time",
                response: "I understand timing is crucial. When would be a better time? Let me schedule a follow-up for then."
            }
        ],
        openingLines: [
            "Hi {name}, I hope I'm not catching you at a bad time?",
            "Hi {name}, do you have 2 minutes for a quick question?",
            "Hi {name}, I promise to keep this brief - can we talk?"
        ],
        closingLines: [
            "Shall we schedule the next steps?",
            "How does moving forward with this sound?",
            "What would help you feel confident about saying yes today?"
        ],
        valueProps: [
            "We help businesses increase efficiency by X%",
            "Our clients typically see ROI within Y months",
            "We've helped Z companies in your industry succeed"
        ]
    };

    return category === 'all' ? library : library[category] || [];
};

export default {
    generateCallingScript,
    predictLeadResponse,
    suggestNextAction,
    getTalkTrackLibrary
};
