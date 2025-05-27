import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import api from '../api';

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<string[]>([]); // Состояние для QR-кодов в формате Base64
    const [reservationFiles, setReservationFiles] = useState<string[]>([]); // Состояние для резервных файлов

    useEffect(() => {
        // Получение данных QR-кодов
        const fetchQrFiles = async () => {
            try {
                // Выполняем запрос для получения всех QR-кодов (которые уже содержат Base64)
                const response = await api.get('/items'); // Предполагается, что эндпоинт возвращает массив QR-кодов с Base64
                const qrBase64Files = response.data.map((item: { qrCode: string }) => item.qrCode); // Извлекаем поле qrCode
                setQrFiles(qrBase64Files); // Устанавливаем состояние
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов:', error);
            }
        };

        // Получение резервных файлов
        const fetchReservationFiles = async () => {
            try {
                const response = await api.get('/folders/reservation');
                setReservationFiles(
                    response.data.map((file: string) => `${file}`) // Формируем URL без baseURL, так как резервное API не изменилось
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
                {qrFiles.map((base64Code, index) => (
                    <li className="file-item" key={index}>
                        {/* Отображение изображения QR-кода */}
                        <img
                            src={`data:image/png;base64,${base64Code}`} // Извлекаем Base64 строку
                            alt={`QR код ${index}`}
                            className="qr-image" // Стилизация изображения
                        />
                        <span className="file-name">QR Code {index + 1}</span>
                        <button
                            className="download-button"
                            onClick={() => handleDownloadQRCode(`qrcode-${index}`)} // Допустим, используется значение `index` для ID
                        >
                            Скачать
                        </button>
                    </li>
                ))}
            </ul>

            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file, index) => (
                    <li className="file-item" key={index}>
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