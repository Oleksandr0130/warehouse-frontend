import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import '../styles/QRScanner.css';
import { useTranslation } from 'react-i18next';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose?: () => void;
}

function QRScanner({ onScan, onClose }: QRScannerProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleSuccess = (mediaStream: MediaStream) => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
                video.srcObject = null;
            }

            video.srcObject = mediaStream;
            video.onloadedmetadata = () => {
                video
                    .play()
                    .catch((err) => {
                        console.error('Error starting video playback:', err);
                    });
            };
            tick();
        };

        const handleError = (err: Error) => {
            console.error('Camera error:', err);
            alert(t('qrScanner.errors.cameraDenied', { message: err.message }));
        };

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then(handleSuccess)
            .catch(handleError);

        const tick = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;

                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        onScan(code.data);
                        stopCamera();
                        return;
                    }
                }
            }
            animationFrameIdRef.current = requestAnimationFrame(tick);
        };

        const stopCamera = () => {
            if (video.srcObject) {
                const mediaStream = video.srcObject as MediaStream;
                mediaStream.getTracks().forEach((track) => track.stop());
                video.srcObject = null;
            }
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        };

        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onScan]);

    return (
        <div className="qr-scanner">
            <h2 className="qr-title">{t('qrScanner.title')}</h2>
            <video ref={videoRef} className="qr-video" aria-label={t('qrScanner.a11y.video')} />

            {onClose && (
                <button className="btn-close" onClick={onClose} aria-label={t('qrScanner.a11y.close')}>
                    ✕ {t('qrScanner.actions.close')}
                </button>
            )}
        </div>
    );
}

export default QRScanner;
