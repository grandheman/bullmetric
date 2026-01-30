import { db } from './firebase';
import { collection, addDoc, writeBatch, doc, getDocs, query, where, orderBy } from 'firebase/firestore';

const TRADES_COLLECTION = 'trades';

export const uploadTrades = async (trades, userId) => {
    if (!userId) throw new Error("User not authenticated");

    const batchSize = 500; // Firestore batch limit
    const chunks = [];

    // Split into chunks
    for (let i = 0; i < trades.length; i += batchSize) {
        chunks.push(trades.slice(i, i + batchSize));
    }

    // Helper function to commit a batch
    const commitBatch = async (chunk) => {
        const batch = writeBatch(db);
        chunk.forEach(trade => {
            // Create a unique document ID combining User ID and Trade content Hash
            // to ensure uniqueness per user but allow overwrites for same trade
            const compositeId = `${userId}_${trade.id}`;
            const docRef = doc(db, TRADES_COLLECTION, compositeId);

            // Use set with merge: true so we update if exists (or create)
            batch.set(docRef, {
                ...trade,
                userId,
                updatedAt: new Date().toISOString()
                // We keep original createdAt if we wanted, but simple set is fine for this app
            }, { merge: true });
        });
        await batch.commit();
    };

    // Process all chunks
    await Promise.all(chunks.map(commitBatch));
};

export const fetchTrades = async (userId, startDate, endDate) => {
    if (!userId) return [];

    // Construct query
    // Note: This requires an index in Firestore if using multiple Where clauses + OrderBy
    // For now we'll fetch basic and filter in memory if complex, or just order by date

    const q = query(
        collection(db, TRADES_COLLECTION),
        where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const trades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort in memory to avoid needing a composite index
    trades.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by date range if provided (and if not doing it in query for simplicity/index reasons)
    if (startDate && endDate) {
        return trades.filter(t => t.date >= startDate && t.date <= endDate);
    }

    return trades;
};

export const deleteAllTrades = async (userId) => {
    if (!userId) throw new Error("User not authenticated");

    const tradesRef = collection(db, TRADES_COLLECTION);
    const q = query(tradesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
};
