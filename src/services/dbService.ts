import { GradingSession } from '../types';

// Database configuration
const DB_NAME = 'CoExEvaluations';
const DB_VERSION = 1;
const STORE_NAME = 'samples';

// Extended interface for stored samples
export interface StoredSample {
    // Primary Key
    id: string; // UUID

    // Metadata
    sampleCode: string;
    date: string; // ISO format (YYYY-MM-DD)
    time: string;
    evaluator: string;
    evaluationType: 'cacao_mass' | 'chocolate';
    sampleInfo: string;
    notes: string;
    producerRecommendations: string;

    // Scores
    attributes: GradingSession['attributes'];
    globalQuality: number;
    selectedQualityId?: string;

    // Timestamps
    createdAt: number; // Unix timestamp
    updatedAt: number; // Unix timestamp

    // UI State
    language: 'en' | 'es';
}

class CoExDB {
    private db: IDBDatabase | null = null;

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error(`Failed to open database: ${request.error?.message}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                    // Create indexes for common queries
                    objectStore.createIndex('sampleCode', 'sampleCode', { unique: false });
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('evaluator', 'evaluator', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    /**
     * Generate a UUID v4
     */
    private generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Save a new sample or update existing one
     */
    async saveSample(sample: Omit<StoredSample, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<string> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const sampleId = id || this.generateUUID();
            const now = Date.now();

            const storedSample: StoredSample = {
                ...sample,
                id: sampleId,
                createdAt: now,
                updatedAt: now,
            };

            const request = store.put(storedSample);

            request.onsuccess = () => {
                resolve(sampleId);
            };

            request.onerror = () => {
                reject(new Error(`Failed to save sample: ${request.error?.message}`));
            };
        });
    }

    /**
     * Get a sample by ID
     */
    async getSample(id: string): Promise<StoredSample | null> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(new Error(`Failed to get sample: ${request.error?.message}`));
            };
        });
    }

    /**
     * Get all samples, sorted by creation date (newest first)
     */
    async getAllSamples(): Promise<StoredSample[]> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('createdAt');
            const request = index.openCursor(null, 'prev'); // Newest first

            const samples: StoredSample[] = [];

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    samples.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(samples);
                }
            };

            request.onerror = () => {
                reject(new Error(`Failed to get all samples: ${request.error?.message}`));
            };
        });
    }

    /**
     * Update a sample
     */
    async updateSample(id: string, updates: Partial<StoredSample>): Promise<void> {
        const db = await this.init();

        return new Promise(async (resolve, reject) => {
            const existingSample = await this.getSample(id);
            if (!existingSample) {
                reject(new Error(`Sample with ID ${id} not found`));
                return;
            }

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const updatedSample: StoredSample = {
                ...existingSample,
                ...updates,
                id, // Ensure ID doesn't change
                updatedAt: Date.now(),
            };

            const request = store.put(updatedSample);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to update sample: ${request.error?.message}`));
            };
        });
    }

    /**
     * Delete a sample by ID
     */
    async deleteSample(id: string): Promise<void> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to delete sample: ${request.error?.message}`));
            };
        });
    }

    /**
     * Delete multiple samples
     */
    async deleteSamples(ids: string[]): Promise<void> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let hasError = false;

            ids.forEach((id) => {
                const request = store.delete(id);

                request.onsuccess = () => {
                    completed++;
                    if (completed === ids.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    hasError = true;
                    reject(new Error(`Failed to delete sample ${id}: ${request.error?.message}`));
                };
            });

            if (ids.length === 0) {
                resolve();
            }
        });
    }

    /**
     * Export all samples (for CSV export)
     */
    async exportAll(): Promise<StoredSample[]> {
        return this.getAllSamples();
    }

    /**
     * Import multiple samples (for CSV import)
     */
    async importSamples(samples: Omit<StoredSample, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let hasError = false;

            samples.forEach((sample) => {
                const id = this.generateUUID();
                const now = Date.now();

                const storedSample: StoredSample = {
                    ...sample,
                    id,
                    createdAt: now,
                    updatedAt: now,
                };

                const request = store.add(storedSample);

                request.onsuccess = () => {
                    completed++;
                    if (completed === samples.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    hasError = true;
                    reject(new Error(`Failed to import sample: ${request.error?.message}`));
                };
            });

            if (samples.length === 0) {
                resolve();
            }
        });
    }

    /**
     * Search samples by sample code (partial match)
     */
    async searchBySampleCode(code: string): Promise<StoredSample[]> {
        const allSamples = await this.getAllSamples();
        const searchTerm = code.toLowerCase();
        return allSamples.filter((sample) =>
            sample.sampleCode.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get samples within a date range
     */
    async getSamplesByDateRange(startDate: string, endDate: string): Promise<StoredSample[]> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('date');

            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.openCursor(range);

            const samples: StoredSample[] = [];

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    samples.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(samples);
                }
            };

            request.onerror = () => {
                reject(new Error(`Failed to get samples by date range: ${request.error?.message}`));
            };
        });
    }

    /**
     * Clear all data (useful for testing or reset)
     */
    async clearAll(): Promise<void> {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to clear database: ${request.error?.message}`));
            };
        });
    }
}

// Export singleton instance
export const dbService = new CoExDB();
