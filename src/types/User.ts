export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER';
    companyId: string;
}