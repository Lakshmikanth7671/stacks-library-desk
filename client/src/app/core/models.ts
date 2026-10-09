export type Role = 'General User' | 'Admin';
export interface User { id: string; name: string; role: Role; department: string; email: string; password?: string; }
export interface AppRecord { id: number; title: string; category: string; access: Role; }
