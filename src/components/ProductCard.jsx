export default function ProductCard({data, setOpen}) {

    return (
        <div className="flex justify-between items-center pl-4 bg-[#292929] text-white rounded-2xl h-[88px]">
            <div className="flex flex-col justify-center items-start">
                <p className="font-bold text-[19px] tracking-widest leading-[24px] -mt-0.5 amertha">{data.name}</p>
                <p className="text-xs mt-1 ml-0.5 text-green-400">Price <span className="font-medium">{data.price}₹</span></p>
                <button onClick={()=>setOpen(true)} className="mt-1.5 uppercase font-bold text-[10px] bg-red-600 px-3 py-[5px] rounded-md">Add To Cart</button>
            </div>
            <img src={`/images/dishes/${data.img}.png`} alt=""  className="mr-1 p-0.5 h-[90%] aspect-square bg-yellow-700 rounded-xl"/>
        </div>
    )
}