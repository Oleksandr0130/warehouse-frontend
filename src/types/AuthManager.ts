// types/AuthManager.ts
import axios from 'axios';

const BASE_URL = '/api';

// РћРїСЂРµРґРµР»СЏРµРј Android WebView РІР°С€РµРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ
const isAndroidApp = (() => {
    try {
        return typeof navigator !== 'undefined' && navigator.userAgent.includes('FlowQRApp/Android');
    } catch {
        return false;
    }
})();

// accessToken (Android) -> sessionStorage, refreshToken -> localStorage
const accessStore = (() => {
    try {
        return isAndroidApp ? sessionStorage : localStorage;
    } catch {
        return localStorage;
    }
})();
const refreshStore = localStorage;

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

const getAccessToken = () =>
    accessStore.getItem(ACCESS_KEY) ?? accessStore.getItem('token'); // b/c РїРѕ СЃС‚Р°СЂРѕРјСѓ РєР»СЋС‡Сѓ

const getRefreshToken = () => refreshStore.getItem(REFRESH_KEY);

const setTokens = (accessToken: string, refreshToken?: string) => {
    accessStore.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) refreshStore.setItem(REFRESH_KEY, refreshToken);
};

const clearTokens = () => {
    accessStore.removeItem(ACCESS_KEY);
    refreshStore.removeItem(REFRESH_KEY);
    // РЅР° РІСЃСЏРєРёР№ СЃР»СѓС‡Р°Р№ СѓР±РµСЂС‘Рј СЃС‚Р°СЂС‹Рµ РєР»СЋС‡Рё
    accessStore.removeItem('token');
};

// РџСЂРѕРІРµСЂРєР°/РѕР±РЅРѕРІР»РµРЅРёРµ С‚РѕРєРµРЅРѕРІ (РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РїСЂРё СЃС‚Р°СЂС‚Рµ/СЂРѕС‚Р°С†РёРё)
const validateTokens = async (): Promise<boolean> => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // РќРµС‚ refresh вЂ” РїРѕРїСЂРѕР±РѕРІР°С‚СЊ cookie-СЃРµСЃСЃРёСЋ (РґР»СЏ РІРµР±Р°), РёРЅР°С‡Рµ РЅРµР°РІС‚РѕСЂРёР·РѕРІР°РЅ
    if (!refreshToken) {
        try {
            await axios.get(`${BASE_URL}/users/me`, { withCredentials: true });
            return true;
        } catch {
            return false;
        }
    }

    // Р•СЃР»Рё access РїРѕС‚РµСЂСЏР»Рё (РЅР°РїСЂРёРјРµСЂ, РїРѕСЃР»Рµ СЂРѕС‚Р°С†РёРё РЅР° Android) вЂ” РѕР±РЅРѕРІРёРј РїРѕ refresh
    if (!accessToken) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
            setTokens(response.data.accessToken, response.data.refreshToken);
            return true;
        } catch (error) {
            console.error('РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ С‚РѕРєРµРЅРѕРІ:', error);
            clearTokens();
            return false;
        }
    }

    return true;
};

// РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ access РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё
const refreshTokensIfNeeded = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
        await validateTokens();
    }
};

// Р’С‹С…РѕРґ
const logout = () => {
    clearTokens();
};

export { validateTokens, refreshTokensIfNeeded, logout };