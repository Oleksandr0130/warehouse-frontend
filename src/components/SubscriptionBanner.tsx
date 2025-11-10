import React, { useMemo } from 'react';
import '../styles/SubscriptionBanner.css';

type Props = {
    planLabel: string;
    daysLeft: number;
    totalDays: number;
    renewsAt?: string;
    onExtend: () => void;
    embedded?: boolean; // если встраивать как секцию
};

const SubscriptionBanner: React.FC<Props> = ({ planLabel, daysLeft, totalDays, renewsAt, onExtend }) => {
    const pct = useMemo(() => {
        const v = Math.max(0, Math.min(100, Math.round((daysLeft / Math.max(1, totalDays)) * 100)));
        return v;
    }, [daysLeft, totalDays]);

    return (
        <div className="sb">
            <div className="sb-left">
                <div className="sb-row">
                    <span className="sb-ico sb-ico--bolt" />
                    <span className="sb-status">Access Active</span>
                    <span className="sb-pill">{planLabel}</span>
                </div>

                <div className="sb-row sb-row--progress">
                    <span className="sb-days">{daysLeft} days remaining</span>
                    <div className="sb-bar">
                        <div className="sb-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="sb-total">{totalDays} days total</span>
                </div>

                <div className="sb-row sb-row--renew">
                    <span className="sb-ico sb-ico--calendar" />
                    <span>Renews on {renewsAt ? new Date(renewsAt).toLocaleDateString() : '—'}</span>
                </div>
            </div>

            <div className="sb-right">
                <button className="sb-btn" onClick={onExtend}>
                    <span className="sb-ico sb-ico--card" />
                    Extend Subscription
                </button>
            </div>
        </div>
    );
};

export default SubscriptionBanner;
