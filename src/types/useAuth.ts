// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import api from '../api';
import {User} from "./User.ts";
import {Company} from "./Company.ts";

export function useAuth() {
    const [user, setUser] = useState<User|null>(null);
    const [company, setCompany] = useState<Company|null>(null);

    useEffect(() => {
        (async () => {
            const { data: u } = await api.get('/auth/me');
            setUser(u);
            const { data: c } = await api.get(`/companies/${u.company.id}`);
            setCompany(c);
        })();
    }, []);

    return { user, company };
}
