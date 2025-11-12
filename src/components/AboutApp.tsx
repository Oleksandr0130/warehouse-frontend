import React from 'react';
import '../styles/AboutApp.css';
import { useTranslation } from 'react-i18next';

const AboutApp: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="about-app">
            <h1 className="about-title">{t('about.title')}</h1>

            <section className="about-section">
                <h2>{t('about.what.title')}</h2>
                <p>{t('about.what.text')}</p>
            </section>

            <section className="about-section">
                <h2>{t('about.features.title')}</h2>
                <ul>
                    <li>
                        <strong>{t('about.features.inventory.label')}</strong> {t('about.features.inventory.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.createItem.label')}</strong> {t('about.features.createItem.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.reserved.label')}</strong> {t('about.features.reserved.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.createReservation.label')}</strong> {t('about.features.createReservation.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.sold.label')}</strong> {t('about.features.sold.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.qr.label')}</strong> {t('about.features.qr.desc')}
                    </li>
                    <li>
                        <strong>{t('about.features.account.label')}</strong> {t('about.features.account.desc')}
                    </li>
                </ul>
            </section>

            <section className="about-section">
                <h2>{t('about.subscription.title')}</h2>
                <p>{t('about.subscription.text')}</p>
            </section>

            <section className="about-section">
                <h2>{t('about.why.title')}</h2>
                <p>{t('about.why.text')}</p>
            </section>

            <section className="about-section">
                <h2>{t('about.contact.title')}</h2>
                <p>
                    {t('about.contact.text')}{" "}
                    <a href="mailto:flowqr.office@gmail.com">flowqr.office@gmail.com</a>
                </p>
            </section>
        </div>
    );
};

export default AboutApp;
