export default function Header() {

    return (
        <div className="sm:h-24 h-16 flex justify-between items-center pl-4 pr-7 relative z-20 bg-gradient-to-r from-red-600 to-[rgb(0,0,0,0.4)">
            <img src="/icons/logo.png" alt="" className="h-[85%] sm:mx-0 brightness-125" />

            <div className="sm:block hidden">
                <ol className="flex gap-x-6 text-white text-xl font-medium">
                    <li>Home</li>
                    <li>Products</li>
                    <li>Abouts us</li>
                    <li>Contact Us</li>
                    <li>Terms & condition</li>
                </ol>
            </div>
        </div>
    )
}