"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AIClient {
    constructor() {
        this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
        this.apiKey = process.env.AI_SERVICE_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('AI_SERVICE_API_KEY environment variable is required');
        }
    }
    async analyzeContent(content, url) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/analyze`, {
                content,
                url
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 400000 // 400 seconds for deepseek model (6+ minutes)
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`AI analysis failed: ${error.response?.data?.detail || error.message}`);
            }
            throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/health`, { timeout: 5000 });
            return response.status === 200;
        }
        catch {
            return false;
        }
    }
}
exports.AIClient = AIClient;
//# sourceMappingURL=aiClient.js.map