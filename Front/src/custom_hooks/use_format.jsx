export default function useFormat(){
    const peso = (value) => new Intl.NumberFormat("en-PH",{
         style: "currency", 
         currency: "PHP", 
         minimumFractionDigits: 2
    }).format(Number(value||0))

    const date = (value) => {
        if(!value) return "—"
        return new Date(value.replace(" ", "T")).toLocaleDateString("en-PH",{
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    return{peso, date}
}