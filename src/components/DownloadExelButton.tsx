import React from 'react';
import api from '../api';
import '../styles/DownloadExcelButton.css';

const DownloadExcelButton: React.FC = () => {
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
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            alert('Failed to download file. Try again later.');
        }
    };

    return (
        <button className="download-excel-button" onClick={handleDownload}>
            📊 Download Excel
        </button>
    );
};

export default DownloadExcelButton;
