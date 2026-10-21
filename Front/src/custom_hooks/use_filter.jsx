import { useMemo, useState } from "react"

export default function useFilter ({setCurrentPage}) {

    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        show: "5"
    })

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const updateFilter = (event) => {
        const { name, value } = event.target

        setFilters((current) => ({
            ...current,
            [name]: value
        }))

        setCurrentPage(1)
    }

    const clearFilters = () => {
        setFilters({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            show: "5"
        })

        setCurrentPage(1)
    }
    const filterParams = useMemo(() => ({
        month: filters.month,
        year: filters.year
    }), [filters.month, filters.year])

    return{filters, months, updateFilter, clearFilters, filterParams}
}