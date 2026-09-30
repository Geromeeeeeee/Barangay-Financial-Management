import { useState } from 'react'
import Revenue_Modal from '../components/revenue_modal'

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div>
            <h1>Revenues</h1>
            <button type="button" onClick={() => setIsModalOpen(true)}>
                Record Revenue
            </button>

            {isModalOpen && (
                <Revenue_Modal setIsModalOpen={setIsModalOpen}/>
            )}
        </div>
    )
}