import { useState } from "react"
export function useErr () {
    const [err, setErr] = useState('')

    return[err, setErr]
}