import { useCallback, useEffect } from "react"
import { scanReceiptImage } from "./use_Scanner"

export default function useVerifyReceipt ({ setOcrStatus, setIsScanning, setReceiptFile, amount, receiptFile }) {

const verifyReceiptWithAmount = useCallback(async (file, currentAmountValue) => {
    if (!file) return
    setOcrStatus('idle')

    const enteredAmount = parseFloat(currentAmountValue)
    if (!enteredAmount || !file.type.startsWith('image/')) return

    try {
        setIsScanning(true)
        const { extractedNumbers, likelyTotal } = await scanReceiptImage(file)

        if ((!extractedNumbers || extractedNumbers.length === 0) && likelyTotal === null) {
            setOcrStatus('unreadable')
        } else {
            const matchFound = (likelyTotal === enteredAmount) || extractedNumbers.includes(enteredAmount)

            if (matchFound) {
                setOcrStatus('matched')
            } else {
                setOcrStatus('mismatch')
            }
        }
    } catch (error) {
        console.error("OCR Error:", error)
        setOcrStatus('unreadable')
    } finally {
        setIsScanning(false)
    }
}, [setOcrStatus, setIsScanning])

const handleReceiptChange = async (file) => {
    setReceiptFile(file)
    await verifyReceiptWithAmount(file, amount)
}

useEffect(() => {
    if (receiptFile && amount) {
        const timer = setTimeout(() => {
            verifyReceiptWithAmount(receiptFile, amount)
        }, 500)
        return () => clearTimeout(timer)
    }
}, [amount, receiptFile, verifyReceiptWithAmount])

return { handleReceiptChange }
}