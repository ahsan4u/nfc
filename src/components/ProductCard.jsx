export default function ProductCard({data, setOpen}) {

    return (
        <div className="flex justify-between items-center pl-4 bg-[#404040] text-white rounded-xl h-[88px]">
            <div className="flex flex-col justify-center items-start">
                <p className="permanent-marker-font font-normal text-lg tracking-wide leading-[24px] -mt-0.5">{data.name}</p>
                <p className="text-sm text-green-400">Price <span className="font-medium">{data.price}₹</span></p>
                <button onClick={()=>setOpen(true)} className="mt-1.5 uppercase font-bold text-[10px] bg-red-600 px-3 py-[5px] rounded-md">Add To Cart</button>
            </div>
            <img src={`/images/dishes/${data.img}.png`} alt=""  className="mr-1 p-0.5 h-[90%] aspect-square bg-[#fec010] rounded-xl"/>
        </div>
    )
}