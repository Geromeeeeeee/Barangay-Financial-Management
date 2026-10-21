export default function usePagination ({currentPage, filters, records}) {
    const pageSize = filters.show === "all"
        ? records.length
        : Number(filters.show)

    const totalPages = Math.max(
        1,
        Math.ceil(records.length / pageSize)
    )

    const startIndex = (currentPage - 1) * pageSize

    const displayedRecords = records.slice(
        startIndex,
        startIndex + pageSize
    )

    return {totalPages, displayedRecords}
}