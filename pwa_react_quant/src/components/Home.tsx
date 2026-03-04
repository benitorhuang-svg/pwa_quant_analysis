import { BarChart3, BookOpen, Code2, Zap } from 'lucide-react';

export default function Home() {
    return (
        <section className="hero">
            <div className="hero-content">
                <div className="hero-badge fade-in" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.2)',
                    borderRadius: '100px',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '2rem'
                }}>
                    <Zap size={14} fill="currentColor" /> v2.0 全新儀表板架構
                </div>

                <h1 className="fade-in">
                    Python <span className="highlight">量化交易</span><br />
                    極致互動教學平台
                </h1>

                <p className="hero-subtitle fade-in" style={{ animationDelay: '0.1s' }}>
                    專為實戰設計的雲端編譯環境。在瀏覽器中直接撰寫、回測並優化你的交易策略，無需安裝任何 Python 環境，即學即練。
                </p>

                <div className="hero-stats fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{
                            width: '48px', height: '48px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-blue)',
                            marginBottom: '1.5rem',
                            marginInline: 'auto'
                        }}>
                            <BookOpen size={24} />
                        </div>
                        <div className="hero-stat-number">7</div>
                        <div className="hero-stat-label">專業教學模組</div>
                    </div>

                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{
                            width: '48px', height: '48px',
                            background: 'rgba(34, 211, 238, 0.1)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-cyan)',
                            marginBottom: '1.5rem',
                            marginInline: 'auto'
                        }}>
                            <Code2 size={24} />
                        </div>
                        <div className="hero-stat-number">20+</div>
                        <div className="hero-stat-label">範例策略代碼</div>
                    </div>

                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{
                            width: '48px', height: '48px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-green)',
                            marginBottom: '1.5rem',
                            marginInline: 'auto'
                        }}>
                            <BarChart3 size={24} />
                        </div>
                        <div className="hero-stat-number">100%</div>
                        <div className="hero-stat-label">免安裝雲端執行</div>
                    </div>
                </div>

                <div className="hero-cta fade-in" style={{ marginTop: '4rem', animationDelay: '0.3s' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        請從上方導航選取課程模組開始你的量化之旅 🚀
                    </p>
                </div>
            </div>
        </section>
    );
}
