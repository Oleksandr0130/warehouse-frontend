import React, { useEffect, useState } from 'react';
import ItemList from './ItemList';
import { Item } from '../types/Item';
import { toast } from 'react-toastify';
import { fetchItems } from '../api';
import { useTranslation } from 'react-i18next';

const ItemsPage: React.FC = () => {
    const { t } = useTranslation();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchItems();
                setItems(data);
            } catch (e) {
                console.error(e);
                toast.error(t('itemsPage.errors.loadItems'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [t]);

    if (loading) {
        return (
            <div className="item-list">
                <p>{t('common.loading')}</p>
            </div>
        );
    }
    return <ItemList items={items} />;
};

export default ItemsPage;
