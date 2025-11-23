// Activity log item for frontend logs
export interface ActivityLogItem {
    id: number;
    description: string;
    category_id?: number;
    timestamp: string;
    category?: string; // Optional category name for display
    length_mins?: number; // optional duration in minutes
    sub_category?: string; // optional sub-category text
}
// Activity AI - Type Definitions

// ============================================================================
// Core Domain Types
// ============================================================================

export interface Activity {
    id: number;
    text: string;
    category: string;
    createdAt: number; // Unix timestamp
    meta?: ActivityMeta;
}

export interface ActivityMeta {
    confidence?: number;
    embedding?: number[];
    tags?: string[];
}

export interface Category {
    name: string;
    description?: string;
    totalMinutes: number;
    activityCount: number;
    createdAt: number;
    lastUsedAt: number;
}

export interface Aggregate {
    category: string;
    period: "week" | "month" | "year";
    periodStart: number; // Unix timestamp
    totalMinutes: number;
    activityCount: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// POST /api/categorize
export interface CategorizeRequest {
    text: string;
    existingCategories?: string[];
}

export interface CategorizeResponse {
    category: string;
    error?: string;
}

// POST /api/insights
export interface InsightsRequest {
    history: Activity[];
    categories: string[];
    weeklyTotals: Record<string, number>;
    monthlyTotals: Record<string, number>;
    yearlyTotals: Record<string, number>;
}

export interface InsightsResponse {
    insight: string;
}

// POST /api/merge-categories
export interface MergeCategoriesRequest {
    categories: string[];
}

export interface CategoryMerge {
    from: string;
    into: string;
}

export interface MergeCategoriesResponse {
    merges: CategoryMerge[];
}

// GET /api/health
export interface HealthResponse {
    status: "ok" | "error";
    timestamp: number;
}

// ============================================================================
// Storage Layer Types
// ============================================================================

export interface StorageConfig {
    dbName: string;
    version: number;
}

export interface StorageStats {
    totalActivities: number;
    totalCategories: number;
    oldestActivity?: number;
    newestActivity?: number;
    storageSize?: number;
}

// ============================================================================
// Trend Analysis Types
// ============================================================================

export interface TrendData {
    weekly: Record<string, CategoryTrend>;
    monthly: Record<string, CategoryTrend>;
    yearly: Record<string, CategoryTrend>;
}

export interface CategoryTrend {
    category: string;
    totalMinutes: number;
    activityCount: number;
    averagePerDay?: number;
    percentageOfTotal?: number;
    changeFromPrevious?: number; // Percentage change
}

export interface TrendPeriod {
    start: number;
    end: number;
    label: string;
}

export interface CategoryMapping {
    name: string;
    description: string;
    examples: string[];
    keywords: string[];
}

export interface TrendComparison {
    current: CategoryTrend[];
    previous: CategoryTrend[];
    changes: TrendChange[];
}

export interface TrendChange {
    category: string;
    change: number; // Percentage
    direction: "up" | "down" | "stable";
    significance: "major" | "minor" | "none";
}

// ============================================================================
// UI State Types
// ============================================================================

export interface AppState {
    activities: Activity[];
    categories: Map<string, Category>;
    selectedPeriod: "week" | "month" | "year";
    trends: TrendData;
    loading: boolean;
    error: string | null;
}

export interface FilterOptions {
    categories?: string[];
    startDate?: number;
    endDate?: number;
    searchText?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type AsyncResult<T> = Promise<{ data?: T; error?: string }>;

export type DateRange = {
    start: number;
    end: number;
};

export type SortDirection = "asc" | "desc";

export type SortField = "createdAt" | "category" | "text";

// ============================================================================
// Conversation Types
// ============================================================================

export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    error?: boolean;
}

export interface ConversationState {
    sessionId: string;
    messages: ConversationMessage[];
    context: ConversationContext;
    needsFollowUp: boolean;
    readyToSave: boolean;
}

export interface ConversationContext {
    activity?: string;
    details?: Record<string, string>;
    category?: string;
}

// POST /api/conversation
export interface ConversationRequest {
    userMessage: string;
    conversationHistory?: ConversationMessage[];
    existingCategories?: string[];
}

export interface ConversationResponse {
    assistantMessage: string;
    needsFollowUp: boolean;
    readyToSave: boolean;
    activityToSave?: {
        text: string;
        category: string;
    };
}


export interface Message {
    id: number;
    role: "user" | "agent";
    content: string;
    timestamp: Date;
}