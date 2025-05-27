import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import api from '../api';

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<string[]>([]);
    const [reservationFiles, setReservationFiles] = useState<string[]>([]);


    const baseURL = 'https://warehouse-qr-app-8adwv.ondigitalocean.app/api'; // Указывается базовый URL

    useEffect(() => {
        const fetchQrFiles = async () => {
            try {
                // Получаем файлы QR-кодов с backend
                const response = await api.get('/folders/qrcodes');
                setQrFiles(
                    response.data.map((file: string) => `${baseURL}${file}`)
                );
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов:', error);
            }
        };

        const fetchReservationFiles = async () => {
            try {
                // Получаем резервные файлы с backend
                const response = await api.get('/folders/reservation');
                setReservationFiles(
                    response.data.map(
                        (file: string) => `${baseURL}${file}`
                    )
                );
            } catch (error) {
                console.error('Ошибка при загрузке резервных файлов:', error);
            }
        };

        fetchQrFiles();
        fetchReservationFiles();
    }, []);

    // Обработчик для скачивания QR-кода
    const handleDownloadQRCode = async (id: string) => {
        try {
            const response = await api.get(`/items/${id}/download-qrcode`, {
                responseType: 'blob', // Указываем бинарный формат для загрузки
            });
            const url = window.URL.createObjectURL(new Blob([response.data])); // Создаем URL для бинарных данных
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${id}.png`); // Устанавливаем имя скачиваемого файла
            document.body.appendChild(link);
            link.click(); // Инициируем скачивание
            document.body.removeChild(link); // Удаляем ссылку после скачивания
        } catch (error) {
            console.error('Ошибка при скачивании QR-кода:', error);
        }
    };


    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.open(event.currentTarget.href, '_blank');
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">Lager QR</h1>
            <ul className="file-list">
                {qrFiles.map((file) => {
                    const fileName = file.split('/').pop() || ''; // Получаем имя файла из пути
                    const fileId = fileName.split('.')[0]; // Извлекаем ID из имени файла (без расширения)
                    return (
                        <li className="file-item" key={file}>
                            <span className="file-name">{fileName}</span>
                            <button
                                className="download-button"
                                onClick={() => handleDownloadQRCode(fileId)}
                            >
                                Скачать
                            </button>
                        </li>
                    );
                })}
            </ul>

            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => (
                    <li className="file-item" key={file}>
                        <a href={file} onClick={handleLinkClick} className="file-link">
                            {file.split('/').pop()}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export default FileViewer;