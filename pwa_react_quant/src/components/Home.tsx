import { BookOpen, Zap, ArrowRight, Activity, Github, TrendingUp } from 'lucide-react';

export default function Home() {
    return (
        <section className="hero">
            <div className="hero-content fade-in" style={{ position: 'relative', zIndex: 1 }}>


                <h1>
                    基於 PWA 技術的 <span className="highlight">量化實戰</span>
                    <br />
                    互動教學平台
                </h1>

                <p className="hero-subtitle">
                    無需配置任何伺服器與本地環境。透過 WebAssembly 直接驅動 <span style={{ whiteSpace: 'nowrap' }}>Python 運算核心</span>，
                    學習理論、動態調整參數，並即時體驗專業級的回測視覺化數據分析。
                </p>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ color: 'var(--brand-secondary)' }}>
                            <BookOpen size={24} />
                        </div>
                        <div className="hero-stat-number">08</div>
                        <div className="hero-stat-label">課程模組</div>
                    </div>

                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ color: 'var(--brand-primary)' }}>
                            <Activity size={24} />
                        </div>
                        <div className="hero-stat-number">20</div>
                        <div className="hero-stat-label">經典量化策略</div>
                    </div>

                    <div className="hero-stat">
                        <div className="hero-stat-icon" style={{ color: 'var(--brand-emerald)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div className="hero-stat-number">100%</div>
                        <div className="hero-stat-label">WebAssembly 驅動</div>
                    </div>
                </div>

                <div style={{
                    marginTop: '3.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <a
                        href="https://github.com/benitorhuang-svg/pwa_quant_analysis"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-dim)',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            transition: 'color 0.3s',
                            marginTop: '4px'
                        }}
                    >
                        {/* 這裡使用者指定要呈現 GitHub 特色的安全帽貓咪圖示，
                            由於 Lucide 預設 Github 圖示就是貓，
                            但若要呈現更強烈的特色，我們可以加入 svg 或維持原 Github icon */}
                        <svg
                            viewBox="0 0 16 16"
                            width="16"
                            height="16"
                            fill="currentColor"
                        >
                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.46-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                        </svg>
                        Open Source on GitHub
                    </a>
                </div>
            </div>
        </section>
    );
}
