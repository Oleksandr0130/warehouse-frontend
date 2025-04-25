import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css'// Импорт стилей

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<string[]>([]);
    const [reservationFiles, setReservationFiles] = useState<string[]>([]);
    const baseURL = 'http://localhost:3000'; // Укажите адрес вашего сервера

    useEffect(() => {
        // Получаем QR-коды
        fetch('/api/folders/qrcodes')
            .then((response) => response.json())
            .then((data) => setQrFiles(data.map((file: string) => `${baseURL}${file}`)));

        // Получаем резервные файлы
        fetch('/api/folders/reservations')
            .then((response) => response.json())
            .then((data) => setReservationFiles(data.map((file: string) => `${baseURL}${file}`)));
    }, []);

    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        const targetUrl = event.currentTarget.href;
        window.open(targetUrl, '_blank'); // Открываем файл в новой вкладке
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">Lager QR</h1>
            <ul className="file-list">
                {qrFiles.map((file) => (
                    <li className="file-item" key={file}>
                        <a href={file} onClick={handleLinkClick} className="file-link">
                            {file.split('/').pop()} {/* Отображаем только имя файла */}
                        </a>
                    </li>
                ))}
            </ul>

            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => (
                    <li className="file-item" key={file}>
                        <a href={file} onClick={handleLinkClick} className="file-link">
                            {file.split('/').pop()} {/* Отображаем только имя файла */}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileViewer;