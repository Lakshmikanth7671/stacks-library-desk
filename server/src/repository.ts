import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export type Role = 'General User' | 'Admin';
export interface User { id: string; name: string; password: string; role: Role; department: string; email: string; }
export interface AppRecord { id: number; title: string; category: string; access: Role; }

/** Storage contract. Routes depend only on this, so the store is a deployment choice (STORE=json | dynamo). */
export interface Repository {
  users(): Promise<User[]>;
  user(id: string): Promise<User | undefined>;
  saveUser(u: User): Promise<void>;
  deleteUser(id: string): Promise<void>;
  records(): Promise<AppRecord[]>;
}

interface Db { users: User[]; records: AppRecord[]; }
const FILE = path.join(__dirname, '..', 'data', 'db.json');

export class JsonRepository implements Repository {
  constructor() { // one-time migration: hash any plain-text seed passwords
    const db = this.read();
    if (db.users.some(u => !u.password.startsWith('$2'))) {
      db.users = db.users.map(u => u.password.startsWith('$2') ? u : { ...u, password: bcrypt.hashSync(u.password, 10) });
      this.write(db);
    }
  }
  private read(): Db { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  private write(db: Db) { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }
  async users() { return this.read().users; }
  async user(id: string) { return this.read().users.find(u => u.id === id); }
  async saveUser(u: User) { const db = this.read(); db.users = [...db.users.filter(x => x.id !== u.id), u]; this.write(db); }
  async deleteUser(id: string) { const db = this.read(); db.users = db.users.filter(u => u.id !== id); this.write(db); }
  async records() { return this.read().records; }
}

/** DynamoDB tables: Users (partition key `id`: string), Records (partition key `id`: number). */
export class DynamoRepository implements Repository {
  private db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));
  private users_ = process.env.USERS_TABLE || 'AccessDeskUsers';
  private records_ = process.env.RECORDS_TABLE || 'AccessDeskRecords';
  async users() { return ((await this.db.send(new ScanCommand({ TableName: this.users_ }))).Items ?? []) as User[]; }
  async user(id: string) { return (await this.db.send(new GetCommand({ TableName: this.users_, Key: { id } }))).Item as User | undefined; }
  async saveUser(u: User) { await this.db.send(new PutCommand({ TableName: this.users_, Item: u })); }
  async deleteUser(id: string) { await this.db.send(new DeleteCommand({ TableName: this.users_, Key: { id } })); }
  async records() { return ((await this.db.send(new ScanCommand({ TableName: this.records_ }))).Items ?? []) as AppRecord[]; }
}

export const createRepository = (): Repository => process.env.STORE === 'dynamo' ? new DynamoRepository() : new JsonRepository();
