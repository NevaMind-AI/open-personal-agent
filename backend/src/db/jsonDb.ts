import Loki from 'lokijs';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = join(process.cwd(), 'workspace', 'db.json');

let db: Loki | null = null;

function ensureDir(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function getDb(): Promise<Loki> {
  return new Promise((resolve) => {
    if (db) return resolve(db);
    ensureDir(DB_PATH);
    db = new Loki(DB_PATH, {
      autoload: true,
      autoloadCallback: () => resolve(db as Loki),
      autosave: true,
      autosaveInterval: 1000,
    });
  });
}

export type JsonDoc<T = any> = T & { id?: string };

export async function getCollection<T = any>(name: string) {
  const database = await getDb();
  let col = database.getCollection<JsonDoc<T>>(name);
  if (!col) col = database.addCollection<JsonDoc<T>>(name, { unique: ['id'] });
  return col;
}

export async function insertOne<T = any>(name: string, doc: JsonDoc<T>) {
  const col = await getCollection<T>(name);
  return col.insert(doc);
}

export async function deleteOne<T = any>(name: string, doc: JsonDoc<T>) {
  const col = await getCollection<T>(name);
  return col.remove(doc);
}

export async function findMany<T = any>(name: string, query: Partial<JsonDoc<T>> = {}) {
  const col = await getCollection<T>(name);
  return col.find(query as any);
}

export async function findOne<T = any>(name: string, query: Partial<JsonDoc<T>>) {
  const col = await getCollection<T>(name);
  return col.findOne(query as any);
}

export async function updateOne<T = any>(name: string, where: Partial<JsonDoc<T>>, patch: Partial<JsonDoc<T>>) {
  const col = await getCollection<T>(name);
  const doc = col.findOne(where as any);
  if (!doc) return null;
  Object.assign(doc, patch);
  col.update(doc);
  return doc;
}

export async function removeMany<T = any>(name: string, where: Partial<JsonDoc<T>>) {
  const col = await getCollection<T>(name);
  const docs = col.find(where as any);
  for (const d of docs) col.remove(d);
  return docs.length;
}


