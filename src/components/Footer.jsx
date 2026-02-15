export default function Footer() {

    return (
        <footer className="mt-20 py-12 bg-gradient-to-t from-black to-[#1a1a1a] border-t border-white/5">
            <div className="max-w-[85%] mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-10">
                <div className="flex flex-col items-center sm:items-start">
                    <img src="/icons/logo.png" alt="NFC Logo" className="h-32 mb-4" />
                    <p className="text-amber-500/80 tracking-[0.2em] uppercase text-[10px] font-bold shimmer-text">Taste That Brings You Back</p>
                </div>

                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="text-xl font-bold permanent-marker-font text-white tracking-widest mb-6">Follow our Journey</h4>
                    <div className="flex gap-4">
                        {[
                            { icon: 'fa-facebook-f', color: 'text-[#1877F2]', link: 'https://www.facebook.com/nfconline' },
                            { icon: 'fa-instagram', color: 'text-[#E4405F]', link: 'https://www.instagram.com/nawab_food_court/' },
                            { icon: 'fa-youtube', color: 'text-[#FF0000]', link: '' },
                            { icon: 'fa-linkedin-in', color: 'text-[#0A66C2]', link: '' }
                        ].map((social, i) => (
                            <a
                                key={i}
                                href={social.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300 group shadow-xl"
                            >
                                <i className={`fa-brands ${social.icon} ${social.color} text-xl group-hover:scale-110 transition-transform`} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">© 2026 NFC CAFE • All Rights Reserved</p>
            </div>
        </footer>
    )
}