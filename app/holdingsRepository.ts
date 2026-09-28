import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import type { HoldingInput, PortfolioHolding } from '../types/portfolio';

const HOLDINGS_COLLECTION = 'holdings';
const USERS_COLLECTION = 'users';

const seedHoldings: HoldingInput[] = [
  {
    ticker: 'JSE:OMU',
    name: 'Old Mutual Limited',
    quantity: 25,
    averagePurchasePrice: 12.8,
    currentPrice: 13.45,
  },
  {
    ticker: 'JSE:ABG',
    name: 'Absa Group Limited',
    quantity: 8,
    averagePurchasePrice: 175,
    currentPrice: 182.5,
  },
];

export function getUserHoldingsPath(uid: string): string {
  return `${USERS_COLLECTION}/${uid}/${HOLDINGS_COLLECTION}`;
}

function getHoldingsCollection(db: Firestore, uid: string) {
  return collection(db, USERS_COLLECTION, uid, HOLDINGS_COLLECTION);
}

function mapHoldingDoc(id: string, data: DocumentData): PortfolioHolding {
  return {
    id,
    ticker: typeof data.ticker === 'string' ? data.ticker : '',
    name: typeof data.name === 'string' ? data.name : '',
    quantity: typeof data.quantity === 'number' ? data.quantity : 0,
    averagePurchasePrice:
      typeof data.averagePurchasePrice === 'number' ? data.averagePurchasePrice : 0,
    currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : 0,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
  };
}

function mapSnapshot(snapshot: QuerySnapshot<DocumentData>): PortfolioHolding[] {
  return snapshot.docs.map((holdingDoc) => mapHoldingDoc(holdingDoc.id, holdingDoc.data()));
}

function serializeHoldingInput(input: HoldingInput): DocumentData {
  return input.notes === undefined
    ? {
        ticker: input.ticker,
        name: input.name,
        quantity: input.quantity,
        averagePurchasePrice: input.averagePurchasePrice,
        currentPrice: input.currentPrice,
      }
    : input;
}

export async function ensureSeedHoldings(db: Firestore, uid: string): Promise<void> {
  const metaRef = doc(db, USERS_COLLECTION, uid, 'portfolioMeta', 'holdingsSeed');
  const seedMeta = await getDoc(metaRef);

  if (seedMeta.exists()) {
    return;
  }

  const holdingsRef = getHoldingsCollection(db, uid);
  const existingHoldings = await getDocs(query(holdingsRef));

  if (!existingHoldings.empty) {
    await setDoc(metaRef, { initializedAt: serverTimestamp() }, { merge: true });
    return;
  }

  const batch = writeBatch(db);

  seedHoldings.forEach((holding) => {
    const holdingRef = doc(holdingsRef);
    batch.set(holdingRef, {
      ...holding,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  batch.set(metaRef, { initializedAt: serverTimestamp() }, { merge: true });

  await batch.commit();
}

export function subscribeToHoldings(
  db: Firestore,
  uid: string,
  onHoldings: (holdings: PortfolioHolding[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(getHoldingsCollection(db, uid), orderBy('ticker')),
    (snapshot) => onHoldings(mapSnapshot(snapshot)),
    (error) => onError(error),
  );
}

export async function addHolding(
  db: Firestore,
  uid: string,
  input: HoldingInput,
): Promise<void> {
  await addDoc(getHoldingsCollection(db, uid), {
    ...serializeHoldingInput(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateHolding(
  db: Firestore,
  uid: string,
  holdingId: string,
  input: HoldingInput,
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid, HOLDINGS_COLLECTION, holdingId), {
    ...serializeHoldingInput(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHolding(
  db: Firestore,
  uid: string,
  holdingId: string,
): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, uid, HOLDINGS_COLLECTION, holdingId));
}
