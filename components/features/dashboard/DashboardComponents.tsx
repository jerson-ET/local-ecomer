'use client'

import { useState, useEffect } from 'react'
import { Rocket, Clock, CreditCard, ChevronRight } from 'lucide-react'

export function MembershipCard({ onPurchase, storeName }: { onPurchase: () => void, storeName: string }) {
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePurchase = () => {
        setIsProcessing(true)
        setTimeout(() => {
            onPurchase()
            setIsProcessing(false)
        }, 1500)
    }

    return (
        <div className="auth-container">
            <div className="auth-card membership-card">
                <div className="membership-header">
                    <div className="icon-badge">
                        <Rocket size={32} />
                    </div>
                    <h2>Upgrade to Pro Vendor</h2>
                    <p>Launch your store: <strong>{storeName}</strong></p>
                </div>

                <div className="pricing-box">
                    <span className="currency">$</span>
                    <span className="amount">15</span>
                    <span className="period">/month</span>
                    <div className="offer-tag">FIRST MONTH FREE</div>
                </div>

                <ul className="features-list">
                    {['Unlimited Products', 'Vendor Dashboard', 'Priority Support', 'Custom Domain'].map((feature, i) => (
                        <li key={i}>
                            <div className="check-icon">✓</div>
                            {feature}
                        </li>
                    ))}
                </ul>

                <div className="total-summary">
                    <div className="summary-row">
                        <span>Today's Total:</span>
                        <span className="free-text">$0.00</span>
                    </div>
                    <p className="summary-note">After 30 days, you will be charged $15.00/mo.</p>
                </div>

                <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="auth-submit-btn purchase-btn"
                >
                    {isProcessing ? 'Processing...' : 'Start 30-Day Free Trial'}
                </button>
            </div>
        </div>
    )
}

export function VendorDashboard({ storeName, trialEndDate }: { storeName: string, trialEndDate: Date }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            const difference = trialEndDate.getTime() - now.getTime()

            if (difference <= 0) {
                setTimeLeft('Trial Expired')
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }, 1000)

        return () => clearInterval(timer)
    }, [trialEndDate])

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Welcome, {storeName}</h1>
                <div className="status-badge active">Active</div>
            </header>

            <div className="dashboard-alert">
                <Clock size={20} />
                <div className="alert-content">
                    <h3>Free Trial Active</h3>
                    <p>Your trial ends in: <strong>{timeLeft}</strong></p>
                </div>
                <button className="upgrade-btn">Manage Subscription</button>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h4>Total Sales</h4>
                    <span className="stat-value">$0.00</span>
                </div>
                <div className="stat-card">
                    <h4>Products</h4>
                    <span className="stat-value">0</span>
                </div>
                <div className="stat-card">
                    <h4>Visitors</h4>
                    <span className="stat-value">0</span>
                </div>
            </div>

            <div className="empty-state">
                <div className="empty-icon-circle">
                    <CreditCard size={40} />
                </div>
                <h3>No products yet</h3>
                <p>Start adding products to your store to begin selling.</p>
                <button className="action-btn">
                    Add First Product <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}
