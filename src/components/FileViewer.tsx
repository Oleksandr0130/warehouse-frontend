import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import api from '../api';

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<string[]>([]); // Состояние для файлов QR-кодов
    const [reservationFiles, setReservationFiles] = useState<string[]>([]); // Состояние для резервных файлов

    const baseURL = 'https://warehouse-qr-app-8adwv.ondigitalocean.app/api'; // Базовый URL к API

    useEffect(() => {
        // Получение данных QR-кодов
        const fetchQrFiles = async () => {
            try {
                // Выполняем запрос для получения данных QR-кодов
                const response = await api.get('/folders/qrcodes');
                setQrFiles(
                    response.data.map((file: string) =>
                        file.startsWith('data:image')
                            ? file // Если это Base64 строка
                            : `${baseURL}${file}` // Если это URL к API
                    )
                );
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов:', error);
            }
        };

        // Получение резервных файлов
        const fetchReservationFiles = async () => {
            try {
                const response = await api.get('/folders/reservation');
                setReservationFiles(
                    response.data.map(
                        (file: string) => `${baseURL}${file}` // Формируем полный путь к файлу
                    )
                );
            } catch (error) {
                console.error('Ошибка при загрузке резервных файлов:', error);
            }
        };

        // Вызов функций
        fetchQrFiles();
        fetchReservationFiles();
    }, []);

    // Обработчик для скачивания QR-кода
    const handleDownloadQRCode = async (id: string) => {
        try {
            const response = await api.get(`/items/${id}/download-qrcode`, {
                responseType: 'blob', // Задаем формат ответа
            });
            const url = window.URL.createObjectURL(new Blob([response.data])); // Генерация URL из бинарных данных
            const link = document.createElement('a'); // Создаем элемент <a>
            link.href = url;
            link.setAttribute('download', `${id}.png`); // Предлагаем имя для скачиваемого файла
            document.body.appendChild(link); // Встраиваем элемент в DOM
            link.click(); // Запускаем скачивание
            document.body.removeChild(link); // Удаляем элемент после скачивания
        } catch (error) {
            console.error('Ошибка при скачивании QR-кода:', error);
        }
    };

    // Обработчик клика по ссылке файла
    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.open(event.currentTarget.href, '_blank'); // Открытие в новой вкладке
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">Lager QR</h1>
            <ul className="file-list">
                {qrFiles.map((file) => {
                    const fileName = file.split('/').pop() || ''; // Извлечение имени файла из пути
                    const fileId = fileName.split('.')[0]; // Извлечение ID файла

                    return (
                        <li className="file-item" key={file}>
                            {/* Отображение изображения QR-кода */}
                            <img
                                src={file.startsWith('data:image') ? file : file} // Base64 или URL
                                alt={`QR код ${fileId}`}
                                className="qr-image" // Стилизация изображения
                            />
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
                        <a
                            href={file}
                            onClick={handleLinkClick}
                            className="file-link"
                        >
                            {file.split('/').pop()}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};



export default FileViewer;