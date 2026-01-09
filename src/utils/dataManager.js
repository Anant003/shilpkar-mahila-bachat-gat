/**
 * dataManager.js - Unified data fetching and caching orchestrator
 * Provides a single source of truth for all API data with intelligent invalidation
 */

import { apiCache } from "./apiCache";

const BASE_URL = "https://sheetdb.io/api/v1/254cxsbebm3n7";

// API endpoints
const ENDPOINTS = {
  MEMBERS: `${BASE_URL}?sheet=Member List`,
  TRANSACTIONS: `${BASE_URL}?sheet=Transactions`,
  LOANS: `${BASE_URL}?sheet=Loan Details`,
};

// Cache TTLs (time-to-live)
const CACHE_TTL = {
  MEMBERS: 30 * 60 * 1000, // 30 minutes - members change infrequently
  TRANSACTIONS: 15 * 60 * 1000, // 15 minutes - moderate change frequency
  LOANS: 15 * 60 * 1000, // 15 minutes - moderate change frequency
};

export const dataManager = {
  /**
   * Fetch all members with caching
   */
  async getMembers(forceRefresh = false) {
    return apiCache.fetch(ENDPOINTS.MEMBERS, {
      ttl: CACHE_TTL.MEMBERS,
      forceRefresh,
    });
  },

  /**
   * Fetch all transactions with caching
   */
  async getTransactions(forceRefresh = false) {
    return apiCache.fetch(ENDPOINTS.TRANSACTIONS, {
      ttl: CACHE_TTL.TRANSACTIONS,
      forceRefresh,
    });
  },

  /**
   * Fetch all loan details with caching
   */
  async getLoans(forceRefresh = false) {
    return apiCache.fetch(ENDPOINTS.LOANS, {
      ttl: CACHE_TTL.LOANS,
      forceRefresh,
    });
  },

  /**
   * Search members locally (no API call)
   */
  searchMembers(query = "") {
    const data = apiCache.getCached(apiCache.getCacheKey(ENDPOINTS.MEMBERS));
    if (!data) return [];

    if (!query) return data;

    const q = query.toLowerCase();
    return data.filter((m) => m.Name && m.Name.toLowerCase().includes(q));
  },

  /**
   * Search transactions locally (no API call)
   */
  searchTransactions(memberName) {
    const data = apiCache.getCached(
      apiCache.getCacheKey(ENDPOINTS.TRANSACTIONS)
    );
    if (!data) return [];

    if (!memberName) return data;

    return data.filter((t) => t.Name === memberName);
  },

  /**
   * Find loan by member name locally (no API call)
   */
  getLoanByMember(memberName) {
    const data = apiCache.getCached(apiCache.getCacheKey(ENDPOINTS.LOANS));
    if (!data) return null;

    return data.find((l) => l.Name === memberName);
  },

  /**
   * Get all loans for member (can have multiple)
   */
  getLoansByMember(memberName) {
    const data = apiCache.getCached(apiCache.getCacheKey(ENDPOINTS.LOANS));
    if (!data) return [];

    return data.filter((l) => l.Name === memberName);
  },

  /**
   * Add new member (POST + cache update)
   */
  async addMember(memberData) {
    const response = await fetch(ENDPOINTS.MEMBERS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [memberData] }),
    });

    if (!response.ok) throw new Error("Failed to add member");

    // Invalidate members cache to force refresh on next fetch
    apiCache.invalidate(ENDPOINTS.MEMBERS);

    return response.json();
  },

  /**
   * Add new transaction (POST + cache invalidation)
   */
  async addTransaction(transactionData) {
    const response = await fetch(`${ENDPOINTS.TRANSACTIONS}&mode=append`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [transactionData] }),
    });

    if (!response.ok) throw new Error("Failed to add transaction");

    // Invalidate transactions cache
    apiCache.invalidate(ENDPOINTS.TRANSACTIONS);

    return response.json();
  },

  /**
   * Update loan (PATCH + cache invalidation)
   */
  async updateLoan(loanId, loanData) {
    const url = `${BASE_URL}/Id/${loanId}?sheet=Loan Details`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: loanData }),
    });

    if (!response.ok) throw new Error("Failed to update loan");

    // Invalidate loans cache
    apiCache.invalidate(ENDPOINTS.LOANS);

    return response.json();
  },

  /**
   * Add new loan (POST + cache invalidation)
   */
  async addLoan(loanData) {
    const response = await fetch(ENDPOINTS.LOANS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [loanData] }),
    });

    if (!response.ok) throw new Error("Failed to add loan");

    // Invalidate loans cache
    apiCache.invalidate(ENDPOINTS.LOANS);

    return response.json();
  },

  /**
   * Delete member (DELETE + cache invalidation)
   */
  async deleteMember(memberName) {
    const url = `${BASE_URL}/Name/${memberName}?sheet=Member List`;
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) throw new Error("Failed to delete member");

    // Invalidate both members and transactions
    apiCache.invalidate(ENDPOINTS.MEMBERS);
    apiCache.invalidate(ENDPOINTS.TRANSACTIONS);

    return response.json();
  },

  /**
   * Delete all transactions for member (DELETE + cache invalidation)
   */
  async deleteTransactions(memberName) {
    const url = `${BASE_URL}/Name/${memberName}?sheet=Transactions`;
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) throw new Error("Failed to delete transactions");

    // Invalidate transactions cache
    apiCache.invalidate(ENDPOINTS.TRANSACTIONS);

    return response.json();
  },
  async deleteTransactionById(id) {
    const url = `${BASE_URL}?sheet=Transactions&Id=${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }

    return response.json();
  },

  async addDeletedMember(data) {
    const url = `${BASE_URL}?sheet=Deleted Members`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [data] }),
    });

    if (!response.ok) throw new Error("Failed to archive deleted member");

    return response.json();
  },

  /**
   * Pre-load all critical data at app startup (single batch operation)
   */
  async preloadData() {
    console.log("[DataManager] Pre-loading critical data...");

    try {
      await Promise.all([
        this.getMembers(),
        this.getTransactions(),
        this.getLoans(),
      ]);

      console.log("[DataManager] Pre-load complete");
    } catch (error) {
      console.error("[DataManager] Pre-load failed:", error);
    }
  },

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return apiCache.getStats();
  },

  /**
   * Clear all caches
   */
  clearCache() {
    apiCache.clear();
  },

  /**
   * Register listener for member updates
   */
  onMembersUpdate(callback) {
    const cacheKey = apiCache.getCacheKey(ENDPOINTS.MEMBERS);
    return apiCache.onUpdate(cacheKey, callback);
  },

  /**
   * Register listener for transaction updates
   */
  onTransactionsUpdate(callback) {
    const cacheKey = apiCache.getCacheKey(ENDPOINTS.TRANSACTIONS);
    return apiCache.onUpdate(cacheKey, callback);
  },

  /**
   * Register listener for loan updates
   */
  onLoansUpdate(callback) {
    const cacheKey = apiCache.getCacheKey(ENDPOINTS.LOANS);
    return apiCache.onUpdate(cacheKey, callback);
  },

  /**
   * Update member details (PUT + cache invalidation)
   * Used for soft delete (marking member as Inactive)
   */
  async updateMember(memberName, updates) {
    // 1️⃣ Get members (cached or API)
    const members = await this.getMembers(true);

    // 2️⃣ Find member by Name
    const member = members.find((m) => m.Name === memberName);

    if (!member || !member.Id) {
      throw new Error(`Member "${memberName}" not found or missing Id`);
    }

    // 3️⃣ Update using Id (SheetDB best practice)
    const url = `${BASE_URL}/Id/${member.Id}?sheet=Member List`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          ...member,
          ...updates,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update member");
    }

    // 4️⃣ Invalidate members cache
    apiCache.invalidate(ENDPOINTS.MEMBERS);

    return response.json();
  },
};
