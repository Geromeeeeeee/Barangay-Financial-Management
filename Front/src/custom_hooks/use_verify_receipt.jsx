import { useCallback, useEffect } from "react"
import { scanReceiptImage } from "./use_Scanner"

export default function useVerifyReceipt ({setOcrStatus, setIsOverridden, setIsScanning, setDetectedAmount, setReceiptFile, amount, receiptFile}) {

const verifyReceiptWithAmount = useCallback(async (file, currentAmountValue) => {
    if (!file) return
    setOcrStatus('idle')
    setIsOverridden(false)

    const enteredAmount = parseFloat(currentAmountValue)
    if (!enteredAmount || !file.type.startsWith('image/')) return

    try {
        setIsScanning(true)
        const { extractedNumbers, likelyTotal } = await scanReceiptImage(file)

        if ((!extractedNumbers || extractedNumbers.length === 0) && likelyTotal === null) {
            setOcrStatus('unreadable')
            setDetectedAmount(null)
        } else {
            const matchFound = (likelyTotal === enteredAmount) || extractedNumbers.includes(enteredAmount)

            if (matchFound) {
                setOcrStatus('matched')
                setDetectedAmount(enteredAmount)
            } else {
                setOcrStatus('mismatch')
                const fallbackAmount = likelyTotal !== null 
                    ? likelyTotal 
                    : (extractedNumbers.length > 0 ? Math.max(...extractedNumbers.filter(n => n < 1000000)) : null)
                setDetectedAmount(fallbackAmount)
            }
        }
    } catch (error) {
        console.error("OCR Error:", error)
        setOcrStatus('unreadable')
    } finally {
        setIsScanning(false)
    }
}, [])

const handleReceiptChange = async (file) => {
    setReceiptFile(file)
    await verifyReceiptWithAmount(file, amount)
}

    // 3. Add this useEffect right here to re-trigger verification when amount changes
useEffect(() => {
    if (receiptFile && amount) {
        const timer = setTimeout(() => {
            verifyReceiptWithAmount(receiptFile, amount)
        }, 500) // 500ms delay so it waits for typing to pause
        return () => clearTimeout(timer)
    }
}, [amount, receiptFile, verifyReceiptWithAmount])

return {handleReceiptChange}
}