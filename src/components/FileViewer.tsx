import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import api from '../api';

interface QRFile {
    id: string;
    name?: string;
    qrCode: string;
}

interface ReservationFile {
    id: string;
    qrCode: string;
    orderNumber: string;
}

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<QRFile[]>([]);
    const [reservationFiles, setReservationFiles] = useState<ReservationFile[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedReservations, setSelectedReservations] = useState<string[]>([]);

    useEffect(() => {
        const fetchQrFiles = async () => {
            try {
                const response = await api.get('/items');
                const qrBase64Files = response.data.map((item: { id: string; qrCode: string; name?: string }) => ({
                    id: item.id,
                    name: item.name,
                    qrCode: item.qrCode,
                }));
                setQrFiles(qrBase64Files);
            } catch (error) {
                console.error('Error loading QR codes for products:', error);
            }
        };

        const fetchReservationFiles = async () => {
            try {
                const response = await api.get('/reservations');
                const reservationFiles = response.data.map(
                    (reservation: { id: string; qrCode: string; orderNumber: string }) => ({
                        id: reservation.id,
                        qrCode: reservation.qrCode,
                        orderNumber: reservation.orderNumber,
                    })
                );
                setReservationFiles(reservationFiles);
            } catch (error) {
                console.error('Error loading reservation QR codes:', error);
            }
        };

        fetchQrFiles();
        fetchReservationFiles();
    }, []);

    // блокируем прокрутку фона при открытой модалке
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showModal]);

    const handleDownloadQRCode = async (id: string, type: 'item' | 'reservation') => {
        try {
            const endpoint = type === 'item'
                ? `/items/${id}/download-qrcode`
                : `/reservations/${id}/download-qrcode`;
            const response = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${id}.png`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading QR code:', error);
            alert(`Failed to download QR code with ID: ${id}`);
        }
    };

    const handleImageClick = (qrCode: string) => {
        setActiveQrCode(qrCode);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setActiveQrCode(null);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    const toggleSelectFile = (id: string) => {
        setSelectedFiles((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectReservation = (id: string) => {
        setSelectedReservations((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handlePrintSelected = () => {
        if (selectedFiles.length === 0 && selectedReservations.length === 0) {
            alert('You have not selected any QR codes to print.');
            return;
        }

        const selectedQrCodes = [
            ...qrFiles
                .filter((file) => selectedFiles.includes(file.id))
                .map(
                    (file) =>
                        `<div style="page-break-after: always;">
                            <h2>${file.name || file.id}</h2>
                            <img src="data:image/png;base64,${file.qrCode}"
                                 style="margin: 10px; width: 200px; height: 200px;" />
                        </div>`
                ),
            ...reservationFiles
                .filter((file) => selectedReservations.includes(file.id))
                .map(
                    (file) =>
                        `<div style="page-break-after: always;">
                            <h2>${file.orderNumber}</h2>
                            <img src="data:image/png;base64,${file.qrCode}"
                                 style="margin: 10px; width: 200px; height: 200px;" />
                        </div>`
                ),
        ].join('');

        const dynamicTitle = `${selectedFiles.join(', ')}`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`
                <html>
                  <head>
                    <title>${dynamicTitle}</title>
                    <style>
                      body { display: flex; flex-direction: column; align-items: center; }
                      div { page-break-after: always; }
                    </style>
                  </head>
                  <body class="print-body">
                    ${selectedQrCodes}
                  </body>
                </html>
            `);
            doc.close();

            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }
    };

    const filteredQrFiles = qrFiles.filter((file) => file.id.toLowerCase().includes(searchTerm));

    return (
        <div className="file-viewer-container">
            {/* Поле для поиска */}
            <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                aria-label="Search by name"
            />

            {/* Кнопка для печати выбранных QR-кодов */}
            <button className="print-button" onClick={handlePrintSelected}>
                Print
            </button>

            <h1 className="file-viewer-title">Warehouse QR</h1>
            <ul className="file-list">
                {filteredQrFiles.map((file) => (
                    <li className="file-item" key={file.id}>
                        <input
                            type="checkbox"
                            className="select-checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => toggleSelectFile(file.id)}
                            aria-label={`Select ${file.id} for print`}
                        />
                        <img
                            src={`data:image/png;base64,${file.qrCode}`}
                            alt={`QR code of item ${file.id}`}
                            className="qr-image"
                            onClick={() => handleImageClick(file.qrCode)}
                            loading="eager"
                            decoding="sync"
                        />
                        <span className="file-name">{file.id}</span>
                        <button
                            className="download-button"
                            onClick={() => handleDownloadQRCode(file.id, 'item')}
                        >
                            Load
                        </button>
                    </li>
                ))}
            </ul>

            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => (
                    <li className="file-item reservation" key={file.id}>
                        <input
                            type="checkbox"
                            className="select-checkbox"
                            checked={selectedReservations.includes(file.id)}
                            onChange={() => toggleSelectReservation(file.id)}
                            aria-label={`Select reservation ${file.orderNumber} for print`}
                        />
                        <img
                            src={`data:image/png;base64,${file.qrCode}`}
                            alt={`QR code for reservation ${file.orderNumber}`}
                            className="qr-image"
                            onClick={() => handleImageClick(file.qrCode)}
                            loading="eager"
                            decoding="sync"
                        />
                        <span className="file-name">Order number: {file.orderNumber}</span>
                        <button
                            className="download-button"
                            onClick={() => handleDownloadQRCode(file.id, 'reservation')}
                        >
                            Load
                        </button>
                    </li>
                ))}
            </ul>

            {/* Модальное окно просмотра QR */}
            {showModal && activeQrCode && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseModal}
                    role="dialog"
                    aria-modal="true"
                    aria-label="QR preview"
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={`data:image/png;base64,${activeQrCode}`}
                            alt="QR Code"
                            className="modal-image"
                            loading="eager"
                            decoding="sync"
                        />
                        <button className="close-button" onClick={handleCloseModal}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileViewer;
