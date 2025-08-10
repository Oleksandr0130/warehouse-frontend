import React from 'react';
import api from '../api';
import '../styles/DownloadExcelButton.css';

const DownloadExcelButton: React.FC = () => {
    const handleDownload = async () => {
        try {
            // Отправляем GET-запрос на backend для скачивания файла
            const response = await api.get('/items/download/excel', {
                responseType: 'blob', // Тип ответа blob для обработки файлов
            });

            // Генерируем ссылку для скачивания файла
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'items.xlsx'); // Имя файла
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
