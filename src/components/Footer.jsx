export default function Footer() {

    return (
        <div className="mt-10 h-52 bg-[#340c0c]">
                <div className="ml-3 pt-3 flex flex-col items-start justify-between h-full">
                    <div className="flex items-end">
                        <img src="/icons/logo.png" alt="Nawab Food Court"  className="h-16"/>
                        <p className="text-slate-500 loader-text">A Place to Remember</p>
                    </div>

                    <div className="mb-8">
                        <h4 className="sm:text-xl text-lg font-bold ml-1 permanent-marker-font text-white tracking-widest">Follow us on</h4>
                        <div className="sm:mt-5 mt-2 flex sm:gap-4 gap-2.5 sm:h-10 h-9  sm:text-lg text-sm">
                            <a href="https://www.facebook.com/nfconline" target="_blank" className="h-full flex items-center justify-center bg-slate-200 aspect-square rounded-full"><i className="fa-brands fa-facebook-f text-blue-700"/></a>
                            <a href="https://www.instagram.com/nawab_food_court/" target="_blank" className="h-full flex items-center justify-center bg-slate-200 aspect-square rounded-full"><i className="fa-brands fa-instagram text-red-500"/></a>
                            <a href="" className="h-full flex items-center justify-center bg-slate-200 aspect-square rounded-full"><i className="fa-brands fa-youtube text-red-500"/></a>
                            <a href="" className="h-full flex items-center justify-center bg-slate-200 aspect-square rounded-full"><i className="fa-brands fa-linkedin-in text-blue-700"/></a>
                        </div>
                    </div>
                </div>
        </div>
    )
}