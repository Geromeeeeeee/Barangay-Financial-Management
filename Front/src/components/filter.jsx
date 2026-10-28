import '../styles/revenue.css'
export default function Filter ({filters, updateFilter, months, years, clearFilters}) {
    return(
        <div className="records-filters">
            <label><span>Month</span><select name="month" value={filters.month} onChange={updateFilter}>{months.map((month, index) => <option key={index + 1} value={index + 1}>{month}</option>)}</select></label>
            <label>
                <span>Year</span>
                <select name="year" value={filters.year} onChange={updateFilter}>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
            </label>
            <label>
            <span>Show</span>
            <select name="show" value={filters.show} onChange={updateFilter}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="all">All</option>
            </select>
        </label>
        <button type="button" className="filter-clear" onClick={clearFilters}>Reset</button>
        </div>
    )
}