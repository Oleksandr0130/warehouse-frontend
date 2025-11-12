import React from 'react';
import api from '../api';
import '../styles/DownloadExcelButton.css';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const DownloadExcelButton: React.FC = () => {
    const { t } = useTranslation();

    const handleDownload = async () => {
        try {
            const response = await api.get('/items/download/excel', {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'items.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);

            toast.success(t('excel.success'));
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            toast.error(t('excel.error'));
        }
    };

    return (
        <button className="download-excel-button" onClick={handleDownload}>
            📊 {t('excel.button')}
        </button>
    );
};

export default DownloadExcelButton;
