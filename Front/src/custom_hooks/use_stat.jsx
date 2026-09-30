import { useState } from "react"
export function useStat () {
    const [stat, setStat] = useState('')

    return[stat, setStat]
}