import '../styles/revenue.css'

export default function Pagination ({setCurrentPage, currentPage, totalPages}) {
    return(
        <div className="pagination">
            <button
                type="button"
                onClick={() => setCurrentPage(page => page - 1)}
                disabled={currentPage === 1}
                className='filter-clear'
            >
                Previous
            </button>

            <span>
                Page {currentPage} of {totalPages}
            </span>

            <button
                type="button"
                onClick={() => setCurrentPage(page => page + 1)}
                disabled={currentPage >= totalPages}
                className='filter-clear'
            >
                Next
            </button>
        </div>
    )
}